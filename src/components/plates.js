// Shared styling for the live widgets (chat box, alert box, event list): colour
// helpers and the per-style "message plate" that mirrors the theme's
// lower-third look at chat-message scale.

// ── Colour helpers ─────────────────────────────────────────────────────────

const hexRgb = (hex) => {
    const h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
export const rgba = (hex, a) => {
    const c = hexRgb(hex);
    return c ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : hex;
};
// Twitch lets users pick any name colour; dark ones (#0000FF) vanish on a dark
// overlay. Lift colours below a luminance floor toward white.
export const readable = (hex, fallback) => {
    const c = hexRgb(hex);
    if (!c) return fallback;
    const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    if (lum >= 0.45) return hex;
    const k = (0.45 - lum) / 0.45 * 0.7;
    return `rgb(${c.map(v => Math.round(v + (255 - v) * k)).join(',')})`;
};
// Stable fallback colour for users who never set one.
const NAME_COLORS = ['#ff7ab6', '#5aa9ff', '#ffd23f', '#2fd36b', '#ff9f43', '#b18cff', '#4fd1c5'];
export const nameColor = (login = '') => NAME_COLORS[[...login].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % NAME_COLORS.length];

// ── Per-variant message plate ──────────────────────────────────────────────
// Returns { box, name, text, ink, window } overrides for one message; `ink`
// marks light plates that need dark text.

export const messagePlate = (variant, T, radius, i) => {
    const a = T.accent, b = T.accent2 ?? T.accent;
    const panel = (al) => rgba(T.panelColor, al);
    switch (variant) {
        case 'slant': return {
            box: { background: `linear-gradient(90deg, ${a} 0 5px, ${panel(0.86)} 5px)`, padding: '6px 16px 6px 14px', clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' },
        };
        case 'glass': return {
            box: { background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: Math.min(radius, 16), padding: '6px 12px' },
        };
        case 'bar': return {
            box: { borderLeft: `3px solid ${a}`, padding: '2px 0 2px 10px' },
            text: { textShadow: '0 1px 6px rgba(0,0,0,0.85)' },
            name: { textShadow: '0 1px 6px rgba(0,0,0,0.85)' },
        };
        case 'neon': return {
            box: { background: panel(0.6), border: `1.5px solid ${a}`, boxShadow: `0 0 8px ${rgba(a, 0.55)}, inset 0 0 8px ${rgba(a, 0.25)}`, borderRadius: Math.min(radius, 10), padding: '6px 12px' },
        };
        case 'brutal': return {
            box: { background: a, border: '2px solid #0a0a0a', boxShadow: `5px 5px 0 ${b}`, padding: '5px 10px', marginRight: 6 },
            text: { color: '#0a0a0a' }, name: { color: '#0a0a0a' }, ink: true,
        };
        case 'tape': return {
            box: { background: '#fffaf0', boxShadow: '0 3px 8px rgba(0,0,0,0.25)', padding: '6px 12px', transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` },
            text: { color: '#2a2620' }, ink: true,
        };
        case 'window': return {
            box: { background: panel(0.9), border: `1.5px solid ${rgba(a, 0.9)}`, borderRadius: Math.min(radius, 8), padding: '0 0 6px', overflow: 'hidden' },
            window: true,
        };
        case 'pixel': return {
            box: { background: panel(0.92), boxShadow: `0 -3px 0 0 ${a}, 0 3px 0 0 ${a}, -3px 0 0 0 ${a}, 3px 0 0 0 ${a}`, padding: '5px 10px', margin: '3px 4px' },
        };
        default: return {   // 'panel'
            box: { background: panel(0.72), borderRadius: Math.min(radius, 12), padding: '6px 12px' },
        };
    }
};

