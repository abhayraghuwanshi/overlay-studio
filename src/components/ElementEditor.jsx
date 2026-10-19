import { AlignCenter, AlignLeft, AlignRight, ChevronDown, Copy, Eye, EyeOff, Info, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { scoresUrl } from '../config';
import { MOODS, DEFAULT_MOOD } from '../theme/moods';
import { PETS, DEFAULT_PET, PetMascot } from './pets';
import { BACKDROPS, FRAME_STYLES, LOWER_THIRDS, TEXT_FX, isGraphicFrame } from './graphics';
import { normalizeChannel } from '../live/twitchChat';
import { ADD_SECTIONS, ELEMENT_TYPE_MAP } from './elementCatalog';

// "Theme" entries store the token, so the element follows theme switches.
const withThemeOption = (list, token) => [{ value: token, label: 'Theme default' }, ...list.map(o => ({ value: o.id, label: o.label }))];

// Quick sticky-note swatches — each pairs a paper colour with readable dark ink.
const NOTE_PAPERS = [
    { label: 'Yellow', paper: '#fde68a', ink: '#3a2f10' },
    { label: 'Pink',   paper: '#fbcfe8', ink: '#4a1233' },
    { label: 'Mint',   paper: '#bbf7d0', ink: '#0f3d27' },
    { label: 'Blue',   paper: '#bfdbfe', ink: '#15315e' },
    { label: 'Orange', paper: '#fed7aa', ink: '#5a2c08' },
    { label: 'Lilac',  paper: '#e9d5ff', ink: '#3b1466' },
];

// ── Panel styling ─────────────────────────────────────────────────────────
// One small set of tokens so every control in the sidebar shares the same
// height, radius and colours.
const C = {
    text: 'rgba(255,255,255,0.9)',
    dim: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.34)',
    field: 'rgba(255,255,255,0.05)',
    line: 'rgba(255,255,255,0.09)',
    accent: '#818cf8',
    accentBg: 'rgba(99,102,241,0.2)',
    danger: '#f87171',
};
const FIELD = {
    background: C.field, border: `1px solid ${C.line}`, borderRadius: 7,
    color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inter, system-ui',
    boxSizing: 'border-box', height: 28,
};
const UNIT = { fontSize: 11, color: C.faint };

// ── Small reusable controls ────────────────────────────────────────────────

const Label = ({ children }) => (
    <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 5 }}>{children}</span>
);

const TextInput = ({ value, onChange, placeholder, style = {}, ...rest }) => (
    <input
        {...rest}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...FIELD, padding: '0 9px', ...style, width: '100%', minWidth: 0, flex: 1 }}
    />
);

const TextArea = ({ value, onChange, placeholder, rows = 4, style = {} }) => (
    <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...FIELD, height: 'auto', padding: '7px 9px', width: '100%', resize: 'vertical', lineHeight: 1.45, ...style }}
    />
);

const NumberInput = ({ value, onChange, min, max, step = 1, style = {} }) => (
    <input
        type="number"
        value={value ?? ''}
        min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{ ...FIELD, width: 64, padding: '0 4px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', ...style }}
    />
);

// A label + control row: the label sits in a fixed left column so every
// control in the panel lines up. `stack` puts the label above wide content.
const Group = ({ label, children, stack = false }) => (
    <div style={stack
        ? { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }
        : { display: 'grid', gridTemplateColumns: label ? '86px minmax(0, 1fr)' : 'minmax(0, 1fr)', alignItems: 'center', columnGap: 10, width: '100%' }}>
        {label && <span style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.3 }}>{label}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            {children}
        </div>
    </div>
);

const ColorInput = ({ value, onChange, label }) => {
    const token = typeof value === 'string' && value.startsWith('@');
    const swatch = (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <label style={{ position: 'relative', width: 26, height: 26, borderRadius: 7, flexShrink: 0, cursor: 'pointer', overflow: 'hidden',
                background: token ? 'conic-gradient(#818cf8, #f472b6, #facc15, #34d399, #818cf8)' : (value || '#ffffff'),
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18)` }}>
                <input
                    type="color"
                    value={token || !value ? '#ffffff' : value}
                    onChange={e => onChange(e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', padding: 0, border: 'none' }}
                />
            </label>
            <span style={{ fontSize: 11, color: token ? C.accent : C.dim, fontFamily: token ? 'inter, system-ui' : 'ui-monospace, monospace' }}>
                {token ? 'Theme colour' : (value?.toUpperCase() || '#FFFFFF')}
            </span>
        </span>
    );
    return label ? <Group label={label}>{swatch}</Group> : swatch;
};

const Slider = ({ value, onChange, min = 0, max = 1, step = 0.01, label, displayValue }) => {
    const control = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <input
                type="range" min={min} max={max} step={step}
                value={value ?? min}
                onChange={e => onChange(Number(e.target.value))}
                style={{ flex: 1, minWidth: 0, accentColor: C.accent, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11, color: C.dim, minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {displayValue ?? Math.round((value ?? 0) * 100) + '%'}
            </span>
        </div>
    );
    return label ? <Group label={label}>{control}</Group> : control;
};

const ToggleBtn = ({ active, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            height: 26, padding: '0 10px', borderRadius: 7, cursor: 'pointer', lineHeight: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            fontSize: 11.5, fontWeight: 600, fontFamily: 'inter, system-ui',
            background: active ? C.accentBg : C.field,
            border: `1px solid ${active ? 'rgba(129,140,248,0.65)' : C.line}`,
            color: active ? '#c7d2fe' : C.dim,
            transition: 'background 0.12s, border-color 0.12s, color 0.12s',
        }}
    >
        {children}
    </button>
);

const CHEVRON = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='rgba(255,255,255,0.55)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>")}")`;
const SelectInput = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
            ...FIELD, width: '100%', padding: '0 26px 0 9px', cursor: 'pointer',
            appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center',
        }}
    >
        {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#0d0d1a' }}>{o.label}</option>
        ))}
    </select>
);

const Hint = ({ children }) => (
    <div style={{
        display: 'flex', gap: 7, alignItems: 'flex-start', width: '100%', boxSizing: 'border-box',
        fontSize: 11, lineHeight: 1.45, color: C.faint,
        padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.line}`,
    }}>
        <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{children}</span>
    </div>
);

// Collapsible section; open/closed state is remembered per section title.
const SECTION_KEY = 'os.editor.sections';
const readSections = () => { try { return JSON.parse(localStorage.getItem(SECTION_KEY) || '{}'); } catch { return {}; } };
const Section = ({ title, children }) => {
    const [open, setOpen] = useState(() => readSections()[title] !== false);
    const toggle = () => {
        setOpen(o => {
            try { localStorage.setItem(SECTION_KEY, JSON.stringify({ ...readSections(), [title]: !o })); } catch { /* storage blocked */ }
            return !o;
        });
    };
    return (
        <div style={{ borderTop: `1px solid ${C.line}` }}>
            <button onClick={toggle} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: C.dim, fontFamily: 'inter, system-ui',
            }}>
                {title}
                <ChevronDown size={14} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s', color: C.faint }} />
            </button>
            {open && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const IconBtn = ({ title, onClick, danger, active, children }) => (
    <button
        onClick={onClick}
        title={title}
        aria-label={title}
        style={{
            width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            background: active ? 'rgba(248,113,113,0.18)' : C.field,
            border: `1px solid ${active ? 'rgba(248,113,113,0.55)' : C.line}`,
            color: danger ? (active ? C.danger : 'rgba(248,113,113,0.75)') : C.dim,
        }}
    >
        {children}
    </button>
);

// The section of the Add panel a type belongs to, shown under its name.
const sectionOf = (type) => ADD_SECTIONS.find(sec => sec.types.includes(type))?.title
    ?? (ELEMENT_TYPE_MAP[type]?.group === 'shape' ? 'Shape' : 'Element');

// ── Main Editor ────────────────────────────────────────────────────────────

// Format an ISO kickoff time as a short local time, e.g. "22:30".
const fmtKickoff = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
};

// Order matches the way a streamer wants to pick them: in-play first, then
// upcoming (soonest kickoff first), then finished (most recent first). Without
// this the feed's date-ascending order buries today's/live games under weeks of
// early group games once the list is capped.
const matchPriority = (m) => (m.status === 'LIVE' || m.status === 'HT') ? 0 : m.status === 'SCHED' ? 1 : 2;
const matchSort = (a, b) => {
    const pa = matchPriority(a), pb = matchPriority(b);
    if (pa !== pb) return pa - pb;
    const ta = +new Date(a.utcDate), tb = +new Date(b.utcDate);
    return pa === 2 ? tb - ta : ta - tb;  // finished: newest first; live/upcoming: soonest first
};

// Relative day label for a match date — "Today" / "Tomorrow" / "Yesterday",
// else a short date like "Jun 24".
const fmtDay = (iso) => {
    try {
        const d = new Date(iso);
        const day0 = new Date(); day0.setHours(0, 0, 0, 0);
        const md = new Date(d); md.setHours(0, 0, 0, 0);
        const diff = Math.round((md - day0) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff === -1) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
};

// Channel field that commits on Enter / blur, so typing a name doesn't open a
// Twitch connection for every partial name on the way.
const ChannelInput = ({ value, onCommit }) => {
    const [draft, setDraft] = useState(value ?? '');
    const [prev, setPrev] = useState(value);
    if (prev !== value) { setPrev(value); setDraft(value ?? ''); }
    const commit = () => {
        const v = normalizeChannel(draft);
        setDraft(v);
        if (v !== (value ?? '')) onCommit(v);
    };
    const bad = draft.trim() !== '' && !normalizeChannel(draft);
    return (
        <TextInput
            value={draft}
            onChange={setDraft}
            placeholder="yourchannel"
            style={{ width: 140, borderColor: bad ? 'rgba(248,113,113,0.6)' : undefined }}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        />
    );
};

const ElementEditor = ({ element, onChange, onDelete, onDuplicate, twitchChannel = '', onTwitchChannelChange }) => {
    const fileRef = useRef(null);
    // Two-step delete: the first click arms it; selecting another element resets.
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [armedFor, setArmedFor] = useState(element?.id);
    if (armedFor !== element?.id) { setArmedFor(element?.id); setConfirmDelete(false); }
    // Match feed for the scoreboard picker — fetched once when a match element is
    // selected. `null` while loading; otherwise { configured, matches: [...] }.
    const [matchFeed, setMatchFeed] = useState(null);
    const [matchQuery, setMatchQuery] = useState('');
    useEffect(() => {
        if (element?.type !== 'match') return;
        let alive = true;
        fetch(scoresUrl())
            .then(r => (r.ok ? r.json() : null))
            .then(d => { if (alive && d) setMatchFeed(d); })
            .catch(() => {});
        return () => { alive = false; };
    }, [element?.type, element?.id]);
    if (!element) return null;

    const set = (key, val) => onChange({ [key]: val });
    const { type } = element;
    const isClipShape = ['triangle', 'diamond', 'hexagon', 'star'].includes(type);
    const isMoodEl = ['moodring', 'pet'].includes(type);
    const isText = ['text', 'lowerthird', 'clock', 'countdown', 'live', 'social', 'pomodoro', 'daycounter', 'ticker'].includes(type);
    const isAutoText = ['clock', 'countdown', 'pomodoro', 'daycounter', 'ticker'].includes(type); // content handled by custom controls (or auto-generated), no generic text input

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onChange({ src: ev.target.result });
        reader.readAsDataURL(file);
    };

    const meta = ELEMENT_TYPE_MAP[type];
    const name = meta?.label ?? type;
    const hasSettings = !['shape', 'circle', 'divider', 'triangle', 'diamond', 'hexagon', 'star'].includes(type);
    const box = element.box ?? { x: 0, y: 0, w: 10, h: 10 };
    const setBox = (k, v) => {
        const n = Math.round(Number(v) * 10) / 10;
        if (!Number.isFinite(n)) return;
        const max = k === 'x' ? 100 - box.w : k === 'y' ? 100 - box.h : 100;
        onChange({ box: { ...box, [k]: Math.max(k === 'w' || k === 'h' ? 1 : 0, Math.min(max, n)) } });
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(7,7,16,0.94)', display: 'flex', flexDirection: 'column', overflowX: 'hidden', fontFamily: 'inter, system-ui' }}>
            {/* ── Header: what is selected + quick actions ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 12px' }}>
                <span style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta?.color ?? C.accent, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.line}`,
                }}>
                    {meta?.preview}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{element.hidden ? 'Hidden · ' : ''}{sectionOf(type)}</div>
                </div>
                <IconBtn title={element.hidden ? 'Show on stream' : 'Hide from stream'} onClick={() => set('hidden', !element.hidden)}>
                    {element.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </IconBtn>
                {onDuplicate && <IconBtn title="Duplicate" onClick={onDuplicate}><Copy size={14} /></IconBtn>}
                <IconBtn
                    title={confirmDelete ? 'Click again to delete' : 'Delete'}
                    danger active={confirmDelete}
                    onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
                >
                    <Trash2 size={14} />
                </IconBtn>
            </div>

            {hasSettings && (
                <Section title={isText ? 'Content' : 'Settings'}>
                {/* ── Text content ── */}
                {isText && !isAutoText && (
                    <Group label="Content">
                        <TextInput
                            value={element.content}
                            onChange={v => set('content', v)}
                            placeholder="Enter text..."
                            style={{ width: 160 }}
                        />
                    </Group>
                )}

                {/* ── Countdown duration ── */}
                {type === 'countdown' && (
                    <Group label="Duration">
                        <NumberInput
                            value={Math.floor((element.durationSec ?? 0) / 60)}
                            onChange={v => set('durationSec', Math.max(0, v) * 60 + (element.durationSec ?? 0) % 60)}
                            min={0} max={180} style={{ width: 52 }}
                        />
                        <span style={UNIT}>min</span>
                        <NumberInput
                            value={(element.durationSec ?? 0) % 60}
                            onChange={v => set('durationSec', Math.floor((element.durationSec ?? 0) / 60) * 60 + Math.min(59, Math.max(0, v)))}
                            min={0} max={59} style={{ width: 52 }}
                        />
                        <span style={UNIT}>sec</span>
                    </Group>
                )}

                {/* ── Day counter: day number + labels ── */}
                {type === 'daycounter' && (
                    <>
                        <Group label="Day">
                            <NumberInput value={element.day ?? 1} onChange={v => set('day', Math.max(0, v))} min={0} max={99999} style={{ width: 64 }} />
                            <ToggleBtn active={false} onClick={() => set('day', Math.max(0, (element.day ?? 1) + 1))} title="Bump to the next day">+1 day</ToggleBtn>
                        </Group>
                        <Group label="Label">
                            <TextInput value={element.prefix ?? 'DAY'} onChange={v => set('prefix', v)} placeholder="DAY" style={{ width: 80 }} />
                        </Group>
                        <Group label="Caption">
                            <TextInput value={element.content} onChange={v => set('content', v)} placeholder="#100DaysOfCode" style={{ width: 160 }} />
                        </Group>
                    </>
                )}

                {/* ── Ticker: messages + scroll speed ── */}
                {type === 'ticker' && (
                    <>
                        <div style={{ width: '100%' }}>
                            <Label>Messages</Label>
                            <TextArea value={element.content} onChange={v => set('content', v)} placeholder="One message per line…" rows={4} />
                        </div>
                        <Group label="Speed">
                            {['slow', 'medium', 'fast'].map(s => (
                                <ToggleBtn key={s} active={(element.speed ?? 'medium') === s} onClick={() => set('speed', s)} title={`Scroll ${s}`}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </ToggleBtn>
                            ))}
                        </Group>
                        <Hint>
                            Each line is a message; they loop with a • between them.
                        </Hint>
                    </>
                )}

                {/* ── LIVE badge: dot colour + pulse ── */}
                {type === 'live' && (
                    <Group label="Dot">
                        <ColorInput value={element.dotColor || '#ef4444'} onChange={v => set('dotColor', v)} />
                        <ToggleBtn active={element.pulse !== false} onClick={() => set('pulse', !(element.pulse !== false))} title="Pulse animation">Pulse</ToggleBtn>
                    </Group>
                )}

                {/* ── Social chip: platform ── */}
                {type === 'social' && (
                    <Group label="Platform">
                        <SelectInput
                            value={element.platform || 'twitch'}
                            onChange={v => set('platform', v)}
                            options={[
                                { value: 'twitch',    label: 'Twitch'      },
                                { value: 'youtube',   label: 'YouTube'     },
                                { value: 'x',         label: 'X / Twitter' },
                                { value: 'instagram', label: 'Instagram'   },
                                { value: 'discord',   label: 'Discord'     },
                                { value: 'tiktok',    label: 'TikTok'      },
                                { value: 'kick',      label: 'Kick'        },
                                { value: 'web',       label: 'Website'     },
                            ]}
                        />
                    </Group>
                )}

                {/* ── Mood-ring: pick mood + auto-cycle ── */}
                {type === 'moodring' && (
                    <>
                        <Group label="Mood">
                            {MOODS.map(m => (
                                <ToggleBtn
                                    key={m.id}
                                    active={(element.mood ?? 'chill') === m.id}
                                    onClick={() => set('mood', m.id)}
                                    title={m.label}
                                >
                                    <span style={{ marginRight: 3 }}>{m.emoji}</span>{m.label}
                                </ToggleBtn>
                            ))}
                        </Group>
                        <Group label="Auto-cycle">
                            <ToggleBtn active={!!element.auto} onClick={() => set('auto', !element.auto)} title="Cycle moods automatically">
                                {element.auto ? 'On' : 'Off'}
                            </ToggleBtn>
                            {element.auto && (
                                <>
                                    <NumberInput value={element.cycleSec ?? 20} onChange={v => set('cycleSec', Math.max(3, v))} min={3} max={600} style={{ width: 56 }} />
                                    <span style={UNIT}>sec each</span>
                                </>
                            )}
                        </Group>
                        <Hint>
                            Any Pet you place mirrors this mood.
                        </Hint>
                    </>
                )}

                {/* ── Pet: pick a species; expression follows the mood-ring ── */}
                {type === 'pet' && (
                    <>
                        <Group label="Pet" stack>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, width: '100%' }}>
                                {PETS.map(p => {
                                    const active = (element.species ?? DEFAULT_PET) === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => set('species', p.id)}
                                            title={p.label}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                                padding: '6px 2px 4px', cursor: 'pointer', borderRadius: 8,
                                                border: `1px solid ${active ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
                                                background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                                            }}
                                        >
                                            <div style={{ width: 34, height: 34, pointerEvents: 'none' }}>
                                                <PetMascot species={p.id} mood={DEFAULT_MOOD} animate={false} />
                                            </div>
                                            <span style={{ fontSize: 8, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)' }}>
                                                {p.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Group>
                        <Group label="Movement">
                            <ToggleBtn
                                active={!element.walk}
                                onClick={() => onChange({ walk: false })}
                                title="Pet stays put in its box"
                            >
                                Stay
                            </ToggleBtn>
                            <ToggleBtn
                                active={!!element.walk}
                                title="Pet roams a full-width floor lane"
                                onClick={() => onChange({
                                    walk: true,
                                    // Expand the box into a full-width lane so the pet has room to
                                    // roam (the box clips, so a small box would hide the walking).
                                    box: { x: 0, y: element.box?.y ?? 80, w: 100, h: element.box?.h ?? 16 },
                                })}
                            >
                                Walk
                            </ToggleBtn>
                        </Group>
                        {element.walk && (
                            <Group label="Speed">
                                {['slow', 'medium', 'fast'].map(s => (
                                    <ToggleBtn key={s} active={(element.speed ?? 'medium') === s} onClick={() => set('speed', s)} title={`Walk ${s}`}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </ToggleBtn>
                                ))}
                            </Group>
                        )}
                        <Hint>
                            {element.walk
                                ? 'The pet roams a full-width lane, walking, turning, and pausing. Drag the lane up/down to set the floor; resize its height to set the pet size.'
                                : "The pet's expression follows the Mood-ring. Add a Mood-ring element to control it; otherwise it stays chill. Resize via the box on canvas."}
                        </Hint>
                    </>
                )}

                {/* ── Decision wheel: options + spin behaviour ── */}
                {type === 'wheel' && (
                    <>
                        <Group label="Options" stack>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
                                {(element.options ?? []).map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <TextInput
                                            value={opt}
                                            onChange={v => { const next = [...(element.options ?? [])]; next[i] = v; set('options', next); }}
                                            placeholder={`Option ${i + 1}`}
                                            style={{ width: 130 }}
                                        />
                                        <button
                                            onClick={() => set('options', (element.options ?? []).filter((_, j) => j !== i))}
                                            disabled={(element.options ?? []).length <= 2}
                                            title="Remove"
                                            style={{ background: 'none', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 5, color: 'rgba(255,100,100,0.7)', fontSize: 11, padding: '3px 6px', display: 'flex', alignItems: 'center', cursor: (element.options ?? []).length <= 2 ? 'not-allowed' : 'pointer', opacity: (element.options ?? []).length <= 2 ? 0.4 : 1 }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => set('options', [...(element.options ?? []), `Option ${(element.options ?? []).length + 1}`])}
                                    disabled={(element.options ?? []).length >= 8}
                                    style={{ alignSelf: 'flex-start', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 5, color: '#a5b4fc', fontSize: 11, padding: '4px 10px', fontFamily: 'inter, system-ui', cursor: (element.options ?? []).length >= 8 ? 'not-allowed' : 'pointer', opacity: (element.options ?? []).length >= 8 ? 0.4 : 1 }}
                                >
                                    + Add option
                                </button>
                            </div>
                        </Group>
                        <Group label="Spin time">
                            <NumberInput value={element.spinSec ?? 4} onChange={v => set('spinSec', Math.max(1, Math.min(15, v)))} min={1} max={15} style={{ width: 52 }} />
                            <span style={UNIT}>sec</span>
                        </Group>
                        <ColorInput value={element.fontColor} onChange={v => set('fontColor', v)} label="Label color" />
                        <Group label="Auto-spin">
                            <ToggleBtn active={!!element.auto} onClick={() => set('auto', !element.auto)} title="Spin automatically">
                                {element.auto ? 'On' : 'Off'}
                            </ToggleBtn>
                            {element.auto && (
                                <>
                                    <NumberInput value={element.cycleSec ?? 30} onChange={v => set('cycleSec', Math.max(5, v))} min={5} max={600} style={{ width: 56 }} />
                                    <span style={UNIT}>sec each</span>
                                </>
                            )}
                        </Group>
                        <Hint>
                            Click the wheel's centre to spin. 2–8 options.
                        </Hint>
                    </>
                )}

                {/* ── Sticky note: text + paper ── */}
                {type === 'note' && (
                    <>
                        <div style={{ width: '100%' }}>
                            <Label>Note</Label>
                            <TextArea value={element.content} onChange={v => set('content', v)} placeholder="Type your note…" rows={5} />
                        </div>
                        <Group label="Text size">
                            <NumberInput value={element.fontSize ?? 16} onChange={v => set('fontSize', Math.max(8, Math.min(48, v)))} min={8} max={48} style={{ width: 52 }} />
                            <ToggleBtn active={!!element.bold} onClick={() => set('bold', !element.bold)} title="Bold">B</ToggleBtn>
                        </Group>
                        <div style={{ width: '100%' }}>
                            <Label>Paper</Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                {NOTE_PAPERS.map(p => {
                                    const active = (element.paperColor || '#fde68a').toLowerCase() === p.paper;
                                    return (
                                        <button key={p.paper} onClick={() => onChange({ paperColor: p.paper, fontColor: p.ink })} title={p.label}
                                            style={{ width: 22, height: 22, borderRadius: 5, background: p.paper, cursor: 'pointer',
                                                border: active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                                                boxShadow: active ? '0 0 6px rgba(255,255,255,0.5)' : 'none', flexShrink: 0 }} />
                                    );
                                })}
                                <ColorInput value={element.paperColor || '#fde68a'} onChange={v => set('paperColor', v)} />
                            </div>
                        </div>
                        <ColorInput value={element.fontColor || '#3a2f10'} onChange={v => set('fontColor', v)} label="Ink (text)" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
                            <Slider label="Tilt" value={element.tilt ?? -3} onChange={v => set('tilt', v)} min={-12} max={12} step={1} displayValue={`${element.tilt ?? -3}°`} />
                        </div>
                    </>
                )}

                {/* ── Pomodoro: work / break minutes ── */}
                {type === 'pomodoro' && (
                    <Group label="Intervals">
                        <NumberInput value={element.workMin ?? 25} onChange={v => set('workMin', Math.max(1, v))} min={1} max={180} style={{ width: 52 }} />
                        <span style={UNIT}>focus</span>
                        <NumberInput value={element.breakMin ?? 5} onChange={v => set('breakMin', Math.max(1, v))} min={1} max={60} style={{ width: 52 }} />
                        <span style={UNIT}>break</span>
                    </Group>
                )}

                {/* ── Goal bar / liquid goal: label, progress, fill colour ── */}
                {(type === 'goal' || type === 'liquidgoal') && (
                    <>
                        <Group label="Label">
                            <TextInput value={element.content} onChange={v => set('content', v)} placeholder="Goal label" style={{ width: 150 }} />
                        </Group>
                        <Group label="Progress">
                            <NumberInput value={element.current} onChange={v => set('current', Math.max(0, v))} min={0} max={1000000} style={{ width: 64 }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>/</span>
                            <NumberInput value={element.target} onChange={v => set('target', Math.max(1, v))} min={1} max={1000000} style={{ width: 64 }} />
                        </Group>
                        <Group label="Text size">
                            <NumberInput value={element.fontSize} onChange={v => set('fontSize', v)} min={8} max={48} />
                        </Group>
                        <ColorInput value={element.fontColor} onChange={v => set('fontColor', v)} label="Text color" />
                        <ColorInput
                            value={typeof element.fillColor === 'string' && element.fillColor.startsWith('@') ? '#6366f1' : element.fillColor}
                            onChange={v => set('fillColor', v)}
                            label="Bar color"
                        />
                    </>
                )}

                {/* ── Match scoreboard: teams, flags, score, status ── */}
                {type === 'match' && (
                    <>
                        {/* Match picker — search the feed and click one to fill + live-link */}
                        <Group label="Find match">
                            <TextInput value={matchQuery} onChange={setMatchQuery} placeholder="Search team (e.g. Brazil)…" style={{ width: 174 }} />
                        </Group>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxHeight: 156, overflowY: 'auto' }}>
                            {!matchFeed && (
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', padding: '2px 0' }}>Loading matches…</div>
                            )}
                            {matchFeed && (matchFeed.matches || [])
                                .slice()
                                .sort(matchSort)
                                .filter(m => {
                                    const s = matchQuery.trim().toLowerCase();
                                    return !s || m.home.name.toLowerCase().includes(s) || m.away.name.toLowerCase().includes(s) || (m.stage || '').toLowerCase().includes(s);
                                })
                                .slice(0, 40)
                                .map(m => {
                                    const sel = String(element.matchId) === String(m.id);
                                    const live = m.status === 'LIVE' || m.status === 'HT';
                                    const right = m.status === 'SCHED' ? fmtKickoff(m.utcDate) : m.status === 'FT' ? 'FT' : m.status === 'HT' ? 'HT' : `${m.minute ?? 0}'`;
                                    return (
                                        <button key={m.id} onClick={() => onChange({
                                            matchId: m.id,
                                            teamA: m.home.name, flagA: m.home.flag,
                                            teamB: m.away.name, flagB: m.away.flag,
                                            scoreA: m.score.home, scoreB: m.score.away,
                                            status: m.status, minute: m.minute ?? 0,
                                            kickoff: m.status === 'SCHED' ? fmtKickoff(m.utcDate) : '',
                                        })} style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 7px', borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
                                            border: `1px solid ${sel ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                            background: sel ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.04)',
                                        }}>
                                            <span style={{ flex: 1, fontSize: 11, color: '#fff', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.home.name} {m.score.home}–{m.score.away} {m.away.name}
                                            </span>
                                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, lineHeight: 1.25 }}>
                                                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{fmtDay(m.utcDate)}</span>
                                                <span style={{ fontSize: 9, fontFamily: 'monospace', color: live ? '#ff7a7a' : 'rgba(255,255,255,0.45)' }}>{right}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            {matchFeed && (matchFeed.matches || []).length === 0 && (
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', padding: '2px 0' }}>
                                    {matchFeed.error ? `Feed error: ${matchFeed.error}` : 'No matches available.'}
                                </div>
                            )}
                        </div>
                        {element.matchId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 9, color: '#4ade80', fontFamily: 'monospace' }}>● Live-linked · auto-updates</span>
                                <ToggleBtn active={false} onClick={() => onChange({ matchId: null })} title="Unlink and edit by hand">Detach</ToggleBtn>
                            </div>
                        )}
                        {/* Match + team info for the linked match (free feed fields) */}
                        {element.matchId && matchFeed && (() => {
                            const sel = (matchFeed.matches || []).find(m => String(m.id) === String(element.matchId));
                            if (!sel) return null;
                            const Flag = ({ f }) => {
                                const s = String(f || '').trim();
                                const src = /^https?:\/\//i.test(s) ? s : (/^[a-z]{2}(-[a-z]{2,3})?$/.test(s.toLowerCase()) ? `https://flagcdn.com/w20/${s.toLowerCase()}.png` : null);
                                return src ? <img src={src} alt="" style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} /> : null;
                            };
                            const meta = [sel.stage, sel.group, sel.matchday ? `MD ${sel.matchday}` : ''].filter(Boolean).join(' · ');
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#fff', fontWeight: 600 }}>
                                        <Flag f={sel.home.flag} /><span>{sel.home.full || sel.home.name}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>vs</span>
                                        <span>{sel.away.full || sel.away.name}</span><Flag f={sel.away.flag} />
                                    </div>
                                    {meta && <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 }}>{meta}</div>}
                                    {sel.referee && <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)' }}>Referee: {sel.referee.name}{sel.referee.nationality ? ` · ${sel.referee.nationality}` : ''}</div>}
                                </div>
                            );
                        })()}
                        {matchFeed && matchFeed.configured === false && (
                            <div style={{ fontSize: 9, color: 'rgba(250,204,21,0.85)', fontFamily: 'monospace', lineHeight: 1.4 }}>
                                Sample data. Set FOOTBALL_DATA_TOKEN for live World Cup matches.
                            </div>
                        )}

                        <Group label="Teams">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                    <TextInput value={element.teamA} onChange={v => set('teamA', v)} placeholder="Home" style={{ width: 86 }} />
                                    <TextInput value={element.flagA} onChange={v => set('flagA', v)} placeholder="br" style={{ width: 44 }} />
                                    <span style={UNIT}>home</span>
                                </div>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                    <TextInput value={element.teamB} onChange={v => set('teamB', v)} placeholder="Away" style={{ width: 86 }} />
                                    <TextInput value={element.flagB} onChange={v => set('flagB', v)} placeholder="ar" style={{ width: 44 }} />
                                    <span style={UNIT}>away</span>
                                </div>
                            </div>
                        </Group>
                        <Group label="Score">
                            <NumberInput value={element.scoreA ?? 0} onChange={v => set('scoreA', Math.max(0, v))} min={0} max={99} style={{ width: 46 }} />
                            <ToggleBtn active={false} onClick={() => set('scoreA', Math.max(0, (element.scoreA ?? 0) + 1))} title="Home +1">+</ToggleBtn>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>–</span>
                            <ToggleBtn active={false} onClick={() => set('scoreB', Math.max(0, (element.scoreB ?? 0) + 1))} title="Away +1">+</ToggleBtn>
                            <NumberInput value={element.scoreB ?? 0} onChange={v => set('scoreB', Math.max(0, v))} min={0} max={99} style={{ width: 46 }} />
                        </Group>
                        <Group label="Status">
                            {[['LIVE', 'Live'], ['HT', 'Half'], ['FT', 'Full'], ['SCHED', 'Soon']].map(([v, l]) => (
                                <ToggleBtn key={v} active={(element.status ?? 'LIVE') === v} onClick={() => set('status', v)} title={l}>{l}</ToggleBtn>
                            ))}
                        </Group>
                        {(element.status ?? 'LIVE') === 'LIVE' && (
                            <Group label="Minute">
                                <NumberInput value={element.minute ?? 0} onChange={v => set('minute', Math.max(0, Math.min(120, v)))} min={0} max={120} style={{ width: 52 }} />
                                <span style={UNIT}>of 90'</span>
                            </Group>
                        )}
                        {(element.status ?? 'LIVE') === 'SCHED' && (
                            <Group label="Kickoff">
                                <TextInput value={element.kickoff} onChange={v => set('kickoff', v)} placeholder="19:00" style={{ width: 90 }} />
                            </Group>
                        )}
                        <Group label="Scorers">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
                                <TextArea value={element.scorersHome} onChange={v => set('scorersHome', v)} rows={2} placeholder={`${element.teamA || 'Home'} — Ronaldo 23', 45', Fernandes 67'`} />
                                <TextArea value={element.scorersAway} onChange={v => set('scorersAway', v)} rows={2} placeholder={`${element.teamB || 'Away'} scorers`} />
                            </div>
                        </Group>
                        <Hint>
                            Scorers are manual — the free feed has no goal data. Separate players with a comma; extra minutes after a name are that player's other goals (Ronaldo 23', 45').
                        </Hint>
                        {(() => {
                            // One goal per comma/newline token that contains a minute.
                            const goals = (s) => String(s || '').split(/[,\n]/).filter(t => /\d/.test(t)).length;
                            const gh = goals(element.scorersHome), ga = goals(element.scorersAway);
                            const sh = element.scoreA ?? 0, sa = element.scoreB ?? 0;
                            const miss = [];
                            if (gh !== sh) miss.push(`${element.teamA || 'Home'} ${gh}/${sh}`);
                            if (ga !== sa) miss.push(`${element.teamB || 'Away'} ${ga}/${sa}`);
                            return miss.length ? (
                                <div style={{ fontSize: 9.5, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1.4, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 5, padding: '5px 8px' }}>
                                    ⚠ Scorers don't match the score — {miss.join(', ')} goals listed. Add the rest, or they came from the live feed.
                                </div>
                            ) : null;
                        })()}
                        <Group label="Size">
                            <NumberInput value={element.fontSize ?? 30} onChange={v => set('fontSize', Math.max(14, Math.min(80, v)))} min={14} max={80} style={{ width: 52 }} />
                        </Group>
                        <ColorInput value={element.fontColor} onChange={v => set('fontColor', v)} label="Name color" />
                        <ColorInput
                            value={typeof element.fillColor === 'string' && element.fillColor.startsWith('@') ? '#facc15' : element.fillColor}
                            onChange={v => set('fillColor', v)}
                            label="Score color"
                        />
                        <Hint>
                            Flag = 2-letter country code (br, ar, fr, de, gb-eng…). Tap + as goals go in.
                        </Hint>
                    </>
                )}
                {/* Lower third sub-text */}
                {type === 'lowerthird' && (
                    <Group label="Subtitle">
                        <TextInput
                            value={element.subContent}
                            onChange={v => set('subContent', v)}
                            placeholder="Role / subtitle"
                            style={{ width: 130 }}
                        />
                    </Group>
                )}
                {/* ── Logo controls ── */}
                {type === 'logo' && (
                    <>
                        <Group label="Image">
                            <button
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    background: 'rgba(99,102,241,0.15)',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                    borderRadius: 5, color: '#a5b4fc',
                                    fontSize: 11, padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontFamily: 'inter, system-ui',
                                }}
                            >
                                {element.src ? <><RefreshCw size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Replace</> : <><Upload size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Upload</>}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            {element.src && (
                                <button
                                    onClick={() => onChange({ src: null })}
                                    style={{ background: 'none', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 5, color: 'rgba(255,100,100,0.7)', fontSize: 11, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </Group>

                        <Group label="Fit">
                            <SelectInput
                                value={element.objectFit}
                                onChange={v => set('objectFit', v)}
                                options={[
                                    { value: 'contain', label: 'Contain' },
                                    { value: 'cover',   label: 'Cover'   },
                                    { value: 'fill',    label: 'Stretch' },
                                ]}
                            />
                        </Group>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
                            <Slider
                                label="Trim (padding)"
                                value={element.imgPadding}
                                onChange={v => set('imgPadding', v)}
                                min={0} max={40} step={1}
                                displayValue={`${element.imgPadding ?? 0}px`}
                            />
                        </div>

                    </>
                )}

                {/* ── Cam frame controls ── */}
                {type === 'frame' && (
                    <>
                        <Group label="Frame style">
                            <SelectInput value={element.frameStyle ?? 'solid'} onChange={v => set('frameStyle', v)} options={withThemeOption(FRAME_STYLES, '@frame')} />
                        </Group>
                        {(element.frameStyle === '@frame' || isGraphicFrame(element.frameStyle)) && (
                            <Group label="Label">
                                <TextInput value={element.content === 'New Title' ? '' : element.content} onChange={v => set('content', v)} placeholder="CAM_01 / webcam.exe / REC" style={{ width: 130 }} />
                            </Group>
                        )}
                        <Group label="Border width">
                            <NumberInput value={element.borderWidth} onChange={v => set('borderWidth', v)} min={1} max={24} style={{ width: 52 }} />
                        </Group>
                        <Hint>
                            Frame colour follows the theme accent. Change it in the Theme panel.
                        </Hint>
                    </>
                )}

                {/* ── Live chat ── */}
                {type === 'chat' && (
                    <>
                        <Group label="Twitch channel">
                            <ChannelInput value={twitchChannel} onCommit={v => onTwitchChannelChange?.(v)} />
                        </Group>
                        <Group label="Style">
                            <SelectInput value={element.variant ?? '@lt'} onChange={v => set('variant', v)} options={withThemeOption(LOWER_THIRDS, '@lt')} />
                        </Group>
                        <Group label="Size">
                            <NumberInput value={element.fontSize} onChange={v => set('fontSize', v)} min={10} max={48} />
                        </Group>
                        <ColorInput value={element.fontColor} onChange={v => set('fontColor', v)} label="Text" />
                        <Group label="Show last">
                            <NumberInput value={element.maxMessages} onChange={v => set('maxMessages', v)} min={1} max={40} style={{ width: 52 }} />
                        </Group>
                        <Group label="Fade after (s)">
                            <NumberInput value={element.fadeSec} onChange={v => set('fadeSec', v)} min={0} max={600} style={{ width: 52 }} />
                        </Group>
                        <Group label="Filter">
                            <ToggleBtn active={element.hideCommands !== false} onClick={() => set('hideCommands', element.hideCommands === false)} title="Hide !commands">!cmds</ToggleBtn>
                            <ToggleBtn active={element.hideBots !== false} onClick={() => set('hideBots', element.hideBots === false)} title="Hide Nightbot, StreamElements and other bots">bots</ToggleBtn>
                        </Group>
                        <Group label="Show">
                            <ToggleBtn active={element.showBadges !== false} onClick={() => set('showBadges', element.showBadges === false)} title="Mod / VIP / sub badges">badges</ToggleBtn>
                            <ToggleBtn active={element.showEvents !== false} onClick={() => set('showEvents', element.showEvents === false)} title="Subs, gift subs and raids">subs & raids</ToggleBtn>
                        </Group>
                        <Hint>
                            Read-only, no login needed. The channel applies to every chat box in this layout. Fade 0 = keep messages.
                        </Hint>
                    </>
                )}

                {/* ── Alert box / event list ── */}
                {(type === 'alerts' || type === 'eventlist') && (
                    <>
                        <Group label="Twitch channel">
                            <ChannelInput value={twitchChannel} onCommit={v => onTwitchChannelChange?.(v)} />
                        </Group>
                        <Group label="Style">
                            <SelectInput value={element.variant ?? '@lt'} onChange={v => set('variant', v)} options={withThemeOption(LOWER_THIRDS, '@lt')} />
                        </Group>
                        <Group label="Size">
                            <NumberInput value={element.fontSize} onChange={v => set('fontSize', v)} min={10} max={72} />
                        </Group>
                        {type === 'alerts' && (
                            <>
                                <Group label="Name effect">
                                    <SelectInput value={element.fx ?? '@fx'} onChange={v => set('fx', v)} options={withThemeOption(TEXT_FX, '@fx')} />
                                </Group>
                                <Group label="Show for (s)">
                                    <NumberInput value={element.durationSec} onChange={v => set('durationSec', v)} min={2} max={30} style={{ width: 52 }} />
                                </Group>
                                <Group label="Sound">
                                    <ToggleBtn active={element.sound !== false} onClick={() => set('sound', element.sound === false)} title="Play a chime in OBS">chime</ToggleBtn>
                                    <ToggleBtn active={element.showMessage !== false} onClick={() => set('showMessage', element.showMessage === false)} title="Show the viewer's message">message</ToggleBtn>
                                </Group>
                            </>
                        )}
                        {type === 'eventlist' && (
                            <>
                                <Group label="Title">
                                    <TextInput value={element.content} onChange={v => set('content', v)} placeholder="(none)" style={{ width: 120 }} />
                                </Group>
                                <Group label="Show last">
                                    <NumberInput value={element.maxEvents} onChange={v => set('maxEvents', v)} min={1} max={20} style={{ width: 52 }} />
                                </Group>
                            </>
                        )}
                        <Group label="Events">
                            {[['showSubs', 'subs'], ['showGifts', 'gifts'], ['showRaids', 'raids'], ['showCheers', 'cheers']].map(([k, label]) => (
                                <ToggleBtn key={k} active={element[k] !== false} onClick={() => set(k, element[k] === false)} title={`Show ${label}`}>{label}</ToggleBtn>
                            ))}
                        </Group>
                        <Group label="Min bits">
                            <NumberInput value={element.minBits} onChange={v => set('minBits', v)} min={1} max={100000} style={{ width: 64 }} />
                        </Group>
                        {type === 'alerts' && (
                            <Group label="Test">
                                {[['sub', 'Sub'], ['resub', 'Resub'], ['giftbomb', 'Gifts'], ['raid', 'Raid'], ['cheer', 'Cheer']].map(([t, label]) => (
                                    <ToggleBtn key={t} active={false} onClick={() => onChange({ test: { type: t, at: Date.now() } })} title={`Play a test ${label.toLowerCase()} alert (also shows in OBS)`}>{label}</ToggleBtn>
                                ))}
                            </Group>
                        )}
                        <Hint>
                            Subs, gift subs, raids and cheers come straight from Twitch chat, no login needed. Follows need Twitch login and aren't supported yet.
                        </Hint>
                    </>
                )}

                {/* ── Backdrop scenery ── */}
                {type === 'backdrop' && (
                    <>
                        <Group label="Scenery">
                            <SelectInput value={element.variant ?? '@backdrop'} onChange={v => set('variant', v)} options={withThemeOption(BACKDROPS, '@backdrop')} />
                        </Group>
                        <Hint>
                            Best on Starting / BRB / Ending screens. It draws over OBS cameras, so leave it out of cam scenes.
                        </Hint>
                    </>
                )}
                </Section>
            )}

            {isText && (
                <Section title="Text style">
                {/* ── Style kit: headline effect / plate style ── */}
                {type === 'text' && (
                    <Group label="Effect">
                        <SelectInput value={element.fx ?? 'plain'} onChange={v => set('fx', v)} options={withThemeOption(TEXT_FX, '@fx')} />
                    </Group>
                )}
                {(type === 'text' || type === 'countdown') && (
                    <Group label="Font">
                        <SelectInput
                            value={element.fontFamily ?? ''}
                            onChange={v => set('fontFamily', v || undefined)}
                            options={[{ value: '', label: 'Theme body' }, { value: '@display', label: 'Theme headline' }]}
                        />
                    </Group>
                )}
                {type === 'lowerthird' && (
                    <Group label="Plate">
                        <SelectInput value={element.variant ?? 'panel'} onChange={v => set('variant', v)} options={withThemeOption(LOWER_THIRDS, '@lt')} />
                    </Group>
                )}
                {/* ── Font controls ── */}
                {isText && (
                    <>
                        <Group label="Size">
                            <NumberInput value={element.fontSize} onChange={v => set('fontSize', v)} min={8} max={120} />
                        </Group>

                        {type === 'lowerthird' && (
                            <Group label="Sub size">
                                <NumberInput value={element.subFontSize} onChange={v => set('subFontSize', v)} min={8} max={60} />
                            </Group>
                        )}

                        <ColorInput value={element.fontColor} onChange={v => set('fontColor', v)} label="Color" />

                        {type === 'lowerthird' && (
                            <ColorInput value={element.subFontColor} onChange={v => set('subFontColor', v)} label="Sub color" />
                        )}

                        <Group label="Style">
                            <ToggleBtn active={element.bold}   onClick={() => set('bold',   !element.bold)}   title="Bold">B</ToggleBtn>
                            <ToggleBtn active={element.italic} onClick={() => set('italic', !element.italic)} title="Italic"><em>I</em></ToggleBtn>
                        </Group>

                        <Group label="Align">
                            {['left', 'center', 'right'].map(a => (
                                <ToggleBtn key={a} active={element.align === a} onClick={() => set('align', a)} title={a}>
                                    {a === 'left' ? <AlignLeft size={13} /> : a === 'center' ? <AlignCenter size={13} /> : <AlignRight size={13} />}
                                </ToggleBtn>
                            ))}
                        </Group>

                    </>
                )}
                </Section>
            )}

            <Section title="Appearance">
                {/* ── Background ── */}
                {type !== 'divider' && type !== 'frame' && type !== 'backdrop' && type !== 'chat' && type !== 'alerts' && type !== 'eventlist' && type !== 'wheel' && type !== 'note' && !isClipShape && !isMoodEl && (
                    <>
                        <ColorInput value={element.bgColor} onChange={v => set('bgColor', v)} label="BG Color" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
                            <Slider
                                label="BG Opacity"
                                value={element.bgOpacity}
                                onChange={v => set('bgOpacity', v)}
                            />
                        </div>
                    </>
                )}
                {/* ── Divider / shape / clip-shape color ── */}
                {(type === 'divider' || type === 'shape' || isClipShape) && (
                    <>
                        <ColorInput value={element.bgColor} onChange={v => set('bgColor', v)} label="Color" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
                            <Slider label="Opacity" value={element.bgOpacity} onChange={v => set('bgOpacity', v)} />
                        </div>
                    </>
                )}
                {/* ── Shared: border radius + element opacity ── */}
                {type !== 'divider' && type !== 'wheel' && type !== 'note' && type !== 'backdrop' && type !== 'chat' && type !== 'alerts' && type !== 'eventlist' && !isClipShape && !isMoodEl && (
                    <Group label="Radius">
                        <NumberInput value={element.borderRadius} onChange={v => set('borderRadius', v)} min={0} max={100} style={{ width: 52 }} />
                    </Group>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
                    <Slider label="Opacity" value={element.opacity} onChange={v => set('opacity', v)} />
                </div>

            </Section>

            <Section title="Position & size">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                    {[['x', 'X'], ['y', 'Y'], ['w', 'Width'], ['h', 'Height']].map(([k, label]) => (
                        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, ...FIELD, padding: '0 8px', height: 30, minWidth: 0 }}>
                            <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{label}</span>
                            <input
                                type="number" step={0.5} value={Math.round((box[k] ?? 0) * 10) / 10}
                                onChange={e => setBox(k, e.target.value)}
                                style={{ flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', padding: 0 }}
                            />
                            <span style={UNIT}>%</span>
                        </label>
                    ))}
                </div>
                <Hint>Percent of the 1920×1080 canvas, so positions match OBS exactly.</Hint>
            </Section>
        </div>
    );
};

export default ElementEditor;
