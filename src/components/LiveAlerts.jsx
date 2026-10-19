import { Gem, Gift, Star, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { normalizeChannel, useTwitchAlerts, useTwitchEvents } from '../live/twitchChat';
import { Body } from './ChatBox';
import { FxText } from './graphics';
import { messagePlate, rgba } from './plates';

// Alert box + event list, both fed by the anonymous Twitch chat connection:
// subs, re-subs, gift subs (gift bombs folded into one), raids and cheers.
// Follows aren't in the chat feed (they need a logged-in Twitch app).

const ALERT_META = {
    sub:      { Icon: Star,  title: 'New subscriber', group: 'subs' },
    resub:    { Icon: Star,  title: 'Resubscribed',   group: 'subs' },
    gift:     { Icon: Gift,  title: 'Gift sub',       group: 'gifts' },
    giftbomb: { Icon: Gift,  title: 'Gift bomb',      group: 'gifts' },
    raid:     { Icon: Users, title: 'Incoming raid',  group: 'raids' },
    cheer:    { Icon: Gem,   title: 'Cheer',          group: 'cheers' },
};

const SAMPLES = {
    sub:      { type: 'sub',      user: 'NightOwl',   amount: 1,   detail: 'Tier 1 sub',        message: 'finally subbed, love the streams!' },
    resub:    { type: 'resub',    user: 'PixelPanda', amount: 12,  detail: '12 months',         message: 'a whole year already 🎉' },
    giftbomb: { type: 'giftbomb', user: 'GenerousGus', amount: 5,  detail: 'gifted 5 subs',     message: '' },
    raid:     { type: 'raid',     user: 'CozyCastle', amount: 42,  detail: '42 raiders',        message: '' },
    cheer:    { type: 'cheer',    user: 'Lunatic',    amount: 500, detail: '500 bits',          message: 'take my bits' },
};
const sampleAlert = (type, at = 0) => ({ ...(SAMPLES[type] ?? SAMPLES.sub), id: `test-${type}-${at}`, emotes: [], ts: at });

// Does this alert pass the element's type filters?
const wanted = (el, a) => {
    const g = ALERT_META[a.type]?.group;
    if (!g) return false;
    if (g === 'subs' && el.showSubs === false) return false;
    if (g === 'gifts' && el.showGifts === false) return false;
    if (g === 'raids' && el.showRaids === false) return false;
    if (g === 'cheers' && (el.showCheers === false || a.amount < (el.minBits ?? 1))) return false;
    return true;
};

// Short synthesized two-note chime (no audio asset to host). OBS plays it when
// the browser source has "Control audio via OBS" on, or straight to desktop.
const chime = (volume = 0.5) => {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        [[880, 0], [1318.5, 0.12]].forEach(([freq, at]) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0, ctx.currentTime + at);
            g.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + at + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.6);
            o.connect(g).connect(ctx.destination);
            o.start(ctx.currentTime + at);
            o.stop(ctx.currentTime + at + 0.65);
        });
        setTimeout(() => ctx.close(), 1200);
    } catch { /* audio blocked — alerts still show */ }
};

// ── Alert card ─────────────────────────────────────────────────────────────

const SPARKS = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2;
    const r = 160 + (i % 3) * 60;
    return { dx: Math.cos(ang) * r, dy: Math.sin(ang) * r * 0.6, delay: (i % 4) * 0.05 };
});

const AlertCard = ({ alert, element, T, leaving = false, ghost = false }) => {
    const meta = ALERT_META[alert.type] ?? ALERT_META.sub;
    const p = messagePlate(element.variant, T, T.cornerRadius ?? 8, 0);
    const fs = element.fontSize ?? 28;
    const ink = p.ink ? '#2a2620' : null;
    const display = element.fontFamily || T.displayFont || T.fontFamily;
    const nameBase = { fontSize: fs * 1.55, fontWeight: 800, color: ink ?? T.textColor, fontFamily: display, lineHeight: 1.1, letterSpacing: 0.5 };
    const fx = element.fx && element.fx !== 'plain' && !ink ? element.fx : null;
    const box = p.ink ? p.box : {
        ...p.box,
        background: `linear-gradient(135deg, ${rgba(T.accent, 0.32)}, ${rgba(T.panelColor, 0.92)} 60%)`,
        border: p.box.border ?? `1px solid ${rgba(T.accent, 0.6)}`,
        boxShadow: `0 18px 50px rgba(0,0,0,0.45), 0 0 40px ${rgba(T.accent, 0.25)}`,
    };

    return (
        <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            gap: fs * 0.18, maxWidth: '100%', boxSizing: 'border-box', fontFamily: T.fontFamily,
            ...box, padding: `${fs * 0.55}px ${fs * 1.2}px`, clipPath: undefined,
            opacity: ghost ? 0.35 : 1,
            animation: ghost ? 'none' : leaving ? 'alertOut 0.5s ease-in forwards' : 'alertIn 0.7s cubic-bezier(.2,.9,.3,1.2)',
        }}>
            {!ghost && !leaving && SPARKS.map((s, i) => (
                <span key={i} style={{
                    position: 'absolute', left: '50%', top: '40%', width: 9, height: 9, marginLeft: -4.5, borderRadius: i % 2 ? 2 : '50%',
                    background: i % 3 ? T.accent : (T.accent2 ?? T.accent), pointerEvents: 'none',
                    '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animation: `alertSpark 0.9s ease-out ${s.delay}s forwards`, opacity: 0,
                }} />
            ))}
            <span style={{
                width: fs * 1.7, height: fs * 1.7, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ink ? '#2a2620' : T.accent, boxShadow: ink ? 'none' : `0 0 24px ${rgba(T.accent, 0.7)}`, flexShrink: 0,
            }}>
                <meta.Icon size={fs * 0.95} color={ink ? '#fffaf0' : '#0b0b14'} strokeWidth={2.4} />
            </span>
            <span style={{ fontSize: fs * 0.55, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: ink ?? T.accent, fontFamily: display }}>
                {meta.title}
            </span>
            {fx ? <FxText fx={fx} base={nameBase} T={T}>{alert.user}</FxText> : <span style={nameBase}>{alert.user}</span>}
            <span style={{ fontSize: fs * 0.7, fontWeight: 600, color: ink ?? T.textColor, opacity: 0.85 }}>{alert.detail}</span>
            {element.showMessage !== false && alert.message && (
                <span style={{ fontSize: fs * 0.6, fontStyle: 'italic', color: ink ?? T.textColor, opacity: 0.75, maxWidth: '90%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    “<Body text={alert.message} emotes={alert.emotes} size={fs * 0.6} />”
                </span>
            )}
        </div>
    );
};

// ── Alert box ──────────────────────────────────────────────────────────────

export const AlertBox = ({ element, T, channel: layoutChannel, editMode }) => {
    const channel = normalizeChannel(element.channel || layoutChannel);
    const [queue, setQueue] = useState([]);
    const [leaving, setLeaving] = useState(false);

    useTwitchAlerts(channel, (a) => {
        if (wanted(element, a)) setQueue(q => [...q, a].slice(-20));
    });

    // Test alerts are published on the element as { type, at } so the editor
    // and the OBS source both play them. A test that predates mount is ignored.
    const testAt = element.test?.at ?? 0;
    const [seenTest, setSeenTest] = useState(testAt);
    if (testAt && testAt !== seenTest) {
        setSeenTest(testAt);
        setQueue(q => [...q, sampleAlert(element.test.type, testAt)].slice(-20));
    }

    const current = queue[0] ?? null;
    const durationMs = Math.max(2, element.durationSec ?? 6) * 1000;
    const muted = editMode || element.sound === false;
    const volume = element.volume ?? 0.5;
    const playedRef = useRef(null);
    useEffect(() => {
        if (!current) return undefined;
        if (!muted && playedRef.current !== current.id) chime(volume);
        playedRef.current = current.id;
        const out = setTimeout(() => setLeaving(true), durationMs);
        const done = setTimeout(() => { setLeaving(false); setQueue(q => q.slice(1)); }, durationMs + 500);
        return () => { clearTimeout(out); clearTimeout(done); };
    }, [current, durationMs, muted, volume]);

    const wrap = (children) => (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: element.opacity ?? 1, position: 'relative' }}>
            {children}
        </div>
    );

    if (current) return wrap(<AlertCard key={current.id} alert={current} element={element} T={T} leaving={leaving} />);
    if (!editMode) return null;   // idle on stream (and in gallery thumbnails): nothing
    return wrap(<>
        <AlertCard alert={sampleAlert('sub')} element={element} T={T} ghost />
        <span style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.7)' }}>
            {channel ? `Alerts for #${channel} pop up here` : 'Set your Twitch channel'} · test from the panel
        </span>
    </>);
};

// ── Event list ─────────────────────────────────────────────────────────────

const SAMPLE_EVENTS = ['raid', 'giftbomb', 'cheer', 'resub', 'sub'].map((t, i) => sampleAlert(t, i + 1));

export const EventList = ({ element, T, channel: layoutChannel, editMode, preview }) => {
    const channel = normalizeChannel(element.channel || layoutChannel);
    const { alerts } = useTwitchEvents(channel);
    const showSample = !channel || (editMode && alerts.length === 0);
    if (showSample && !editMode && !preview) return null;

    const fs = element.fontSize ?? 18;
    const max = Math.max(1, element.maxEvents ?? 6);
    const list = (showSample ? SAMPLE_EVENTS : [...alerts].reverse()).filter(a => wanted(element, a)).slice(0, max);
    const title = element.content ?? 'RECENT EVENTS';

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: fs * 0.35, fontFamily: T.fontFamily, opacity: element.opacity ?? 1 }}>
            {title && (
                <div style={{ fontSize: fs * 0.7, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: T.accent, fontFamily: T.displayFont || T.fontFamily, textShadow: '0 1px 6px rgba(0,0,0,0.6)', flexShrink: 0 }}>
                    {title}
                </div>
            )}
            {list.map((a, i) => {
                const { Icon } = ALERT_META[a.type] ?? ALERT_META.sub;
                const p = messagePlate(element.variant, T, T.cornerRadius ?? 8, i);
                const ink = p.ink ? '#2a2620' : null;
                return (
                    <div key={a.id} style={{
                        ...p.box, display: 'flex', alignItems: 'center', gap: fs * 0.5, fontSize: fs, lineHeight: 1.25,
                        color: ink ?? T.textColor, animation: 'chatIn 0.35s ease-out', flexShrink: 0, opacity: showSample ? 0.8 : 1,
                    }}>
                        <Icon size={fs * 1.05} color={ink ?? T.accent} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, ...p.name }}>{a.user}</span>
                        <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: fs * 0.85, whiteSpace: 'nowrap', flexShrink: 0 }}>{a.detail}</span>
                    </div>
                );
            })}
        </div>
    );
};
