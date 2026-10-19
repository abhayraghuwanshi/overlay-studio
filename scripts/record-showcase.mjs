// Records template promo videos from the ?showcase player.
//
//   npm run dev                      # in another terminal (or pass --url)
//   npm run promo                    # all presets below
//   npm run promo -- montage         # one preset
//
// Drives your installed Google Chrome (playwright-core, no browser download)
// at 1920×1080, captures every painted frame over the DevTools screencast, and
// encodes with ffmpeg. Each preset is recorded twice: 16:9, and a native
// 1080×1920 vertical layout (?vertical) for Shorts / TikTok / Reels. Output
// lands in promo-videos/ (gitignored).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { PORTS } from '../ports.config.js';

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='));
const BASE = urlArg ? urlArg.slice(6) : `http://localhost:${PORTS.FRONTEND}`;
const OUT = path.resolve('promo-videos');
const FPS = 30;

// What to record. `query` is appended to /?showcase.
const PRESETS = {
    // Fast tour of every new pack's Starting Soon screen.
    montage: { query: 'scenes=0&sec=2.6' },
    // Full walk-throughs of a few packs (every scene).
    'tour-samurai': { query: 'packs=kit-samurai&sec=3' },
    'tour-sun-moon': { query: 'packs=kit-sun-moon&sec=3' },
    'tour-spooky': { query: 'packs=kit-spooky&sec=3' },
    // Just Chatting layouts across packs: live chat, alerts and cam shapes.
    'just-chatting': { query: 'packs=kit-valhalla,kit-kitty,kit-night-city,kit-esports,kit-coffee&scenes=2,3&sec=3' },
};

const run = (cmd, cmdArgs) => new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}\n${err.slice(-1500)}`))));
});

const record = async (browser, name, query, vertical) => {
    const [vw, vh] = vertical ? [1080, 1920] : [1920, 1080];
    const frameDir = path.join(OUT, `.frames-${name}`);
    fs.rmSync(frameDir, { recursive: true, force: true });
    fs.mkdirSync(frameDir, { recursive: true });

    const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/?showcase&${query}${vertical ? '&vertical' : ''}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);   // let fonts / first animation frames settle

    // Every painted frame arrives with a timestamp; keep them on disk (a long
    // 1080p recording would not fit in memory) and acknowledge so more come.
    const cdp = await page.context().newCDPSession(page);
    const frames = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
        const file = path.join(frameDir, `f${String(frames.length).padStart(6, '0')}.jpg`);
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        frames.push({ file, ts: metadata.timestamp });
        cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: vw, maxHeight: vh, everyNthFrame: 1 });

    const info = await page.evaluate(() => window.__showcaseInfo);
    await page.evaluate(() => window.__showcaseStart());
    const expectMs = info.introMs + info.steps * info.sec * 1000 + info.outroMs;
    await page.waitForFunction(() => window.__showcaseDone === true, null, { timeout: expectMs + 30000, polling: 100 });
    await page.waitForTimeout(300);
    await cdp.send('Page.stopScreencast');
    await page.close();
    if (frames.length < 2) throw new Error(`${name}: no frames captured`);

    // Frames arrive only when something repaints, so give each one the time
    // until the next as its duration, then resample to a constant frame rate.
    const list = path.join(frameDir, 'list.txt');
    const lines = frames.map((f, i) => {
        const dur = i + 1 < frames.length ? frames[i + 1].ts - f.ts : 1 / FPS;
        return `file '${f.file}'\nduration ${Math.max(0.001, dur).toFixed(4)}`;
    });
    lines.push(`file '${frames[frames.length - 1].file}'`);   // concat demuxer needs the last file repeated
    fs.writeFileSync(list, lines.join('\n'));

    const seconds = frames[frames.length - 1].ts - frames[0].ts;
    const mp4 = path.join(OUT, `${name}.mp4`);
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
        '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', mp4]);

    fs.rmSync(frameDir, { recursive: true, force: true });
    console.log(`✓ ${name}: ${seconds.toFixed(1)}s, ${frames.length} frames (~${(frames.length / seconds).toFixed(0)} fps captured) → ${path.relative(process.cwd(), mp4)}`);
};

const main = async () => {
    const names = args.filter(a => !a.startsWith('--'));
    const todo = names.length ? names : Object.keys(PRESETS);
    const unknown = todo.filter(n => !PRESETS[n]);
    if (unknown.length) throw new Error(`Unknown preset(s): ${unknown.join(', ')}. Available: ${Object.keys(PRESETS).join(', ')}`);

    const res = await fetch(BASE).catch(() => null);
    if (!res?.ok) throw new Error(`Can't reach ${BASE}. Start the app with \`npm run dev\` first (or pass --url=…).`);

    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch({ channel: 'chrome', headless: !args.includes('--headed') });
    try {
        for (const n of todo) {
            await record(browser, n, PRESETS[n].query, false);
            await record(browser, `${n}-vertical`, PRESETS[n].query, true);
        }
    } finally {
        await browser.close();
    }
};

main().catch(e => { console.error(e.message); process.exit(1); });
