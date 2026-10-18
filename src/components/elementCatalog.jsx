/* eslint-disable react-refresh/only-export-components -- data module: the catalog tables, no components */
import { Bot, Camera, ListChecks, Monitor, Video } from 'lucide-react';

// Catalog of everything that can go on the canvas — the built-in boxes
// (cameras, AI companion, task bar) and the element/shape types with their
// swatch previews. Shared by the Add toolbox (LayersPanel) and the layer strip
// under the canvas (LayerStrip).

// One soft tone per toolbox section instead of a colour per item — reads as a
// calm, consistent set rather than a rainbow. Previews draw in `currentColor`
// (the tile sets it), so an item's icon always matches its section.
const TONE = {
    cams:   '#a5b4fc', // periwinkle
    text:   '#c4b5fd', // lavender
    timers: '#7dd3fc', // sky
    goals:  '#86efac', // mint
    fun:    '#f9a8d4', // rose
    shapes: '#cbd5e1', // slate
};

export const BUILTIN_LAYERS = [
    { id: 'faceCam',       label: 'Face Cam',     color: TONE.cams, Icon: Camera },
    { id: 'handCam',       label: 'Hand Cam',     color: TONE.cams, Icon: Video },
    { id: 'roomCam',       label: 'Room Cam',     color: TONE.cams, Icon: Monitor },
    { id: 'aiCompanion',   label: 'AI Companion', color: TONE.cams, Icon: Bot },
    { id: 'currentTask',   label: 'Current Task', color: TONE.cams, Icon: ListChecks },
];
export const BUILTIN_MAP = Object.fromEntries(BUILTIN_LAYERS.map(l => [l.id, l]));

const C = 'currentColor';
const dim = (o) => ({ background: C, opacity: o });
const bar = (w, h, o = 1, extra) => <span style={{ width: w, height: h, borderRadius: 2, display: 'block', ...dim(o), ...extra }} />;
const mono = (txt, size = 9, extra) => <span style={{ fontSize: size, fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 600, color: C, letterSpacing: -0.3, lineHeight: 1, ...extra }}>{txt}</span>;

// A clipped solid preview swatch for the polygon shapes.
const clipSwatch = (clip, w = 18, h = 16) => (
    <span style={{ width: w, height: h, background: C, clipPath: clip, display: 'block', opacity: 0.9 }} />
);

// `group` controls which Add subsection a type appears under: 'element' (content)
// or 'shape' (primitives). Defaults to 'element' when omitted.
export const ELEMENT_TYPES = [
    // ── Text & branding ──
    { type: 'text',       label: 'Text',        color: TONE.text, preview: <span style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Georgia, serif', lineHeight: 1, color: C }}>T</span> },
    { type: 'lowerthird', label: 'Lower third', color: TONE.text, preview: (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start', width: 24 }}>
            {bar(22, 3)}{bar(14, 2, 0.45)}
        </span>
    )},
    { type: 'logo',       label: 'Image',       color: TONE.text, preview: (
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke={C} strokeWidth="1.6" strokeLinejoin="round">
            <rect x="1" y="1" width="18" height="14" rx="2.5" />
            <circle cx="6.5" cy="5.5" r="1.6" fill={C} stroke="none" />
            <path d="M2 13 L8 8 L12 11 L15 9 L18 12" />
        </svg>
    )},
    { type: 'social',     label: 'Social',      color: TONE.text, preview: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C, lineHeight: 1 }}>@</span>{bar(11, 3, 0.45)}
        </span>
    )},
    { type: 'live',       label: 'Live badge',  color: TONE.text, preview: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px', borderRadius: 99, boxShadow: `inset 0 0 0 1px ${C}` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', display: 'block', background: '#f87171' }} />
            {mono('LIVE', 7, { fontFamily: 'inherit', fontWeight: 700, letterSpacing: 0.4 })}
        </span>
    )},
    { type: 'ticker',     label: 'Ticker',      color: TONE.text, preview: (
        <span style={{ width: 26, height: 10, borderRadius: 3, boxShadow: `inset 0 0 0 1px ${C}`, display: 'flex', alignItems: 'center', gap: 2.5, padding: '0 3px', boxSizing: 'border-box', overflow: 'hidden' }}>
            {bar(9, 2)}{bar(2.5, 2.5, 0.5, { borderRadius: '50%' })}{bar(9, 2)}
        </span>
    )},
    { type: 'frame',      label: 'Cam frame',   color: TONE.text, preview: <span style={{ width: 20, height: 14, borderRadius: 3, display: 'block', boxShadow: `inset 0 0 0 2px ${C}` }} /> },

    // ── Timers ──
    { type: 'clock',      label: 'Clock',       color: TONE.timers, preview: (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke={C} strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="9" r="7.5" /><path d="M9 4.8 V9 L11.8 10.6" />
        </svg>
    )},
    { type: 'countdown',  label: 'Countdown',   color: TONE.timers, preview: mono('05:00') },
    { type: 'pomodoro',   label: 'Pomodoro',    color: TONE.timers, preview: (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', display: 'block', boxShadow: `inset 0 0 0 1.5px ${C}` }} />
            {mono('25:00', 7)}
        </span>
    )},
    { type: 'daycounter', label: 'Day counter', color: TONE.timers, preview: (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, gap: 1 }}>
            <span style={{ fontSize: 6, fontFamily: 'ui-monospace, monospace', color: C, opacity: 0.65, letterSpacing: 1 }}>DAY</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: C }}>42</span>
        </span>
    )},

    // ── Goals & scores ──
    { type: 'goal',       label: 'Goal bar',    color: TONE.goals, preview: (
        <span style={{ width: 24, height: 5, borderRadius: 3, overflow: 'hidden', display: 'block', position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 0, ...dim(0.2) }} />
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '68%', borderRadius: 3, background: C }} />
        </span>
    )},
    { type: 'liquidgoal', label: 'Liquid goal', color: TONE.goals, preview: (
        <span style={{ width: 12, height: 19, borderRadius: 4, boxShadow: `inset 0 0 0 1.5px ${C}`, overflow: 'hidden', display: 'block', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%', ...dim(0.75) }} />
        </span>
    )},
    { type: 'match',      label: 'Scoreboard',  color: TONE.goals, preview: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {bar(6, 5, 0.5, { borderRadius: 1 })}{mono('1–0', 9, { fontWeight: 800 })}{bar(6, 5, 0.5, { borderRadius: 1 })}
        </span>
    )},

    // ── Fun & interactive ──
    { type: 'pet',        label: 'Channel pet', color: TONE.fun, preview: (
        <svg width="18" height="15" viewBox="0 0 120 100">
            {/* loaf cat, single tone */}
            <path d="M22 30 L29 6 L46 26 Z" fill={C} />
            <path d="M90 30 L83 6 L66 26 Z" fill={C} />
            <ellipse cx="56" cy="57" rx="40" ry="33" fill={C} />
            <ellipse cx="44" cy="54" rx="5.5" ry="7" fill="#15121c" />
            <ellipse cx="68" cy="54" rx="5.5" ry="7" fill="#15121c" />
        </svg>
    )},
    { type: 'moodring',   label: 'Mood ring',   color: TONE.fun, preview: (
        <span style={{ width: 15, height: 15, borderRadius: '50%', display: 'block', boxShadow: `inset 0 0 0 2.5px ${C}, 0 0 6px -1px ${C}` }} />
    )},
    { type: 'wheel',      label: 'Spin wheel',  color: TONE.fun, preview: (
        <svg width="18" height="18" viewBox="0 0 20 20">
            {[0, 1, 2, 3].map(i => (
                <path key={i} d="M10 10 L10 1.5 A8.5 8.5 0 0 1 18.5 10 Z" fill={C} opacity={[1, 0.55, 0.8, 0.35][i]} transform={`rotate(${i * 90} 10 10)`} />
            ))}
            <circle cx="10" cy="10" r="2.4" fill="#15121c" />
        </svg>
    )},
    { type: 'note',       label: 'Sticky note', color: TONE.fun, preview: (
        <span style={{ position: 'relative', width: 15, height: 15, display: 'block', transform: 'rotate(-5deg)', borderRadius: 2, ...dim(0.9) }}>
            <span style={{ position: 'absolute', top: 4, left: 3, right: 3, height: 1.5, background: '#15121c', opacity: 0.5 }} />
            <span style={{ position: 'absolute', top: 7.5, left: 3, right: 6, height: 1.5, background: '#15121c', opacity: 0.5 }} />
        </span>
    )},

    // ── Shapes ──
    { type: 'shape',    group: 'shape', label: 'Rectangle', color: TONE.shapes, preview: <span style={{ width: 20, height: 13, borderRadius: 3, display: 'block', boxShadow: `inset 0 0 0 2px ${C}` }} /> },
    { type: 'circle',   group: 'shape', label: 'Ellipse',   color: TONE.shapes, preview: <span style={{ width: 16, height: 16, borderRadius: '50%', display: 'block', boxShadow: `inset 0 0 0 2px ${C}` }} /> },
    { type: 'divider',  group: 'shape', label: 'Line',      color: TONE.shapes, preview: bar(22, 2, 0.9) },
    { type: 'triangle', group: 'shape', label: 'Triangle',  color: TONE.shapes, preview: clipSwatch('polygon(50% 0%, 100% 100%, 0% 100%)') },
    { type: 'diamond',  group: 'shape', label: 'Diamond',   color: TONE.shapes, preview: clipSwatch('polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)') },
    { type: 'hexagon',  group: 'shape', label: 'Hexagon',   color: TONE.shapes, preview: clipSwatch('polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', 19) },
    { type: 'star',     group: 'shape', label: 'Star',      color: TONE.shapes, preview: clipSwatch('polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)') },
];

export const ELEMENT_TYPE_MAP = Object.fromEntries(ELEMENT_TYPES.map(t => [t.type, t]));
export const SHAPE_ELEMENTS = ELEMENT_TYPES.filter(t => t.group === 'shape');

// Toolbox sections, in the order a streamer usually reaches for them. Every
// non-shape type should appear in exactly one (stragglers fall into "More").
export const ADD_SECTIONS = [
    { title: 'Text & branding',  types: ['text', 'lowerthird', 'logo', 'social', 'live', 'ticker', 'frame'] },
    { title: 'Timers',           types: ['clock', 'countdown', 'pomodoro', 'daycounter'] },
    { title: 'Goals & scores',   types: ['goal', 'liquidgoal', 'match'] },
    { title: 'Fun & interactive', types: ['pet', 'moodring', 'wheel', 'note'] },
];
const SECTIONED = new Set(ADD_SECTIONS.flatMap(s => s.types));
const LEFTOVER = ELEMENT_TYPES.filter(t => t.group !== 'shape' && !SECTIONED.has(t.type)).map(t => t.type);
if (LEFTOVER.length) ADD_SECTIONS.push({ title: 'More', types: LEFTOVER });
