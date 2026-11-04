import { Redis } from '@upstash/redis';

// One small KV store holds the overlay design, keyed per `room`. This replaces
// the old local Node server's layout-settings.json so OBS can load the design
// from an always-on URL with nothing running on your machine.
//
// Env vars (set in the Vercel dashboard — both Upstash-direct and Vercel-KV
// marketplace naming are accepted):
//   UPSTASH_REDIS_REST_URL / KV_REST_API_URL
//   UPSTASH_REDIS_REST_TOKEN / KV_REST_API_TOKEN
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Create the client lazily so a missing env var doesn't spam warnings at import
// time and we can return one clear error instead.
let _redis;
function getRedis() {
    if (!REDIS_URL || !REDIS_TOKEN) {
        throw new Error('KV not configured: set KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) for this environment.');
    }
    if (!_redis) _redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    return _redis;
}

const roomOf = (room) => String(room || 'default').slice(0, 64).replace(/[^\w.-]/g, '_');
// Three keys per room, so polls stay cheap (Upstash bills bandwidth per byte):
//   layout:<room>     — the live design (everything except the saved library)
//   layoutlib:<room>  — the saved layouts/scenes library (`layouts`), often
//                       hundreds of KB; only the editor needs it, never OBS
//   layoutver:<room>  — a tiny version tag, bumped on every write
const keysFor = (room) => {
    const r = roomOf(room);
    return { key: `layout:${r}`, libKey: `layoutlib:${r}`, verKey: `layoutver:${r}` };
};
const newVer = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Older rooms stored `layouts` inside the main blob. Move it to its own key the
// first time we touch the room; returns the main blob without it.
async function splitLegacy(redis, keys, main) {
    if (!main || !('layouts' in main)) return main;
    const { layouts, ...rest } = main;
    const p = redis.pipeline();
    p.set(keys.libKey, layouts ?? []);
    p.set(keys.key, rest);
    await p.exec();
    return rest;
}

export default async function handler(req, res) {
    // The overlay and editor are same-origin in production, but keep CORS open
    // so a separately-hosted frontend (or `vite` dev) can talk to this too.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    const keys = keysFor(req.query.room);
    // Every anonymous visitor lands on `default`; its library had grown to
    // 200+ strangers' layouts (~1 MB per editor load), so it isn't stored there.
    const isShared = roomOf(req.query.room) === 'default';

    try {
        const redis = getRedis();

        if (req.method === 'GET') {
            // ?v=<version> — the client already has this version: answer with an
            // empty 204 after reading only the tiny version key.
            let ver = await redis.get(keys.verKey);
            if (ver == null) {
                ver = newVer();
                await redis.set(keys.verKey, ver);
            }
            ver = String(ver);
            if (req.query.v && String(req.query.v) === ver) {
                res.status(204).end();
                return;
            }

            // ?lite=1 (OBS overlays) skips the saved-layouts library entirely.
            // The shared default room never serves one (it's per-browser there).
            const lite = req.query.lite !== undefined || isShared;
            const main = await splitLegacy(redis, keys, await redis.get(keys.key)); // parsed JSON
            const out = { ...(main || {}) };
            if (!lite) {
                const layouts = await redis.get(keys.libKey);
                if (layouts != null) out.layouts = layouts;
            }
            out._v = ver;
            res.status(200).json(out);
            return;
        }

        if (req.method === 'POST') {
            const body =
                typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
            // `_clientId` was only used to de-dupe WebSocket echoes; `_v` is the
            // version a client got back — neither belongs in the stored design.
            const { _clientId, _v, layouts: sentLayouts, ...patch } = body;
            const layouts = isShared ? undefined : sentLayouts;
            const p = redis.pipeline();
            const existing = (await redis.get(keys.key)) || {};
            const hasLegacy = 'layouts' in existing;
            if (Object.keys(patch).length || hasLegacy) {
                const { layouts: legacyLayouts, ...rest } = existing;
                // Migrate a legacy inline library unless this write replaces it.
                if (hasLegacy && layouts === undefined) p.set(keys.libKey, legacyLayouts ?? []);
                p.set(keys.key, { ...rest, ...patch });
            }
            if (layouts !== undefined) p.set(keys.libKey, layouts);
            const ver = newVer();
            p.set(keys.verKey, ver);
            await p.exec();
            res.status(200).json({ ok: true, _v: ver });
            return;
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
