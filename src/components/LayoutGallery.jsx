import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getTheme } from '../theme/themes';
import { bgToStyle } from './BackgroundPanel';
import CameraFrame, { DEFAULT_CAM_STYLE } from './CameraFrame';
import ElementRenderer from './ElementRenderer';

// Layouts gallery — each card is a LAYOUT (a "show": a named container of
// scenes). Switching a layout makes it active and loads its active scene.
// Thumbnails render the scene for real — the same element renderers at the
// OBS 1920×1080 size, scaled down to the card — so they look like the overlay
// instead of a wireframe. ‹ › on the card flips through every scene in the layout.

const BASE_W = 1920;
const BASE_H = 1080;
const CAM_LABELS = { faceCam: 'CAM', handCam: 'HAND', roomCam: 'ROOM' };

// Static mini overlay. Mounts the real elements only once the card scrolls into
// view (a gallery has a dozen-plus of these, some with timers and animations).
// `fallbackTheme` covers starter scenes, which carry the theme on the starter
// (themeId) rather than in each snapshot.
const Thumb = ({ snapshot = {}, fallbackTheme }) => {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
        ro.observe(el);
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '200px' });
        io.observe(el);
        return () => { ro.disconnect(); io.disconnect(); };
    }, []);

    const theme = getTheme(snapshot.theme ?? fallbackTheme);
    const vis = snapshot.boxVisibility ?? {};
    const cams = Object.entries(snapshot.boxes ?? {}).filter(([id]) => vis[id] && CAM_LABELS[id]);
    const els = snapshot.elements ?? [];
    const shown = els.filter(e => !e.hidden && e.box);
    const mood = els.find(e => e.type === 'moodring' && !e.hidden)?.mood ?? 'chill';
    const scale = width / BASE_W;

    return (
        <div ref={ref} style={{
            position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#0a0a14', // base so transparent layouts still read
            ...bgToStyle(snapshot.background),
        }}>
            {seen && width > 0 && (
                <div aria-hidden="true" style={{
                    position: 'absolute', top: 0, left: 0, width: BASE_W, height: BASE_H,
                    transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none',
                }}>
                    {cams.map(([id, b]) => {
                        const cs = snapshot.camStyles?.[id] ?? DEFAULT_CAM_STYLE;
                        return (
                            <div key={id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}>
                                <CameraFrame frame={cs.frame} radius={cs.radius} accent={cs.accent ?? theme.accent} accent2={cs.accent2 ?? theme.accent2}>
                                    {/* stand-in for the webcam OBS shows through the frame */}
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: 40, letterSpacing: 6, color: 'rgba(255,255,255,0.28)' }}>{CAM_LABELS[id]}</span>
                                    </div>
                                </CameraFrame>
                            </div>
                        );
                    })}
                    {shown.map((e, i) => (
                        <div key={e.id} style={{
                            position: 'absolute', left: `${e.box.x}%`, top: `${e.box.y}%`, width: `${e.box.w}%`, height: `${e.box.h}%`,
                            overflow: 'hidden', zIndex: 100 + (els.length - 1 - i),
                        }}>
                            <ElementRenderer element={e} theme={theme} mood={mood} editMode={false} />
                        </div>
                    ))}
                </div>
            )}
            {cams.length === 0 && shown.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }}>empty</div>
            )}
        </div>
    );
};

const PagerBtn = ({ onClick, title, children }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, padding: 0, cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.85)', transition: 'background 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
    >
        {children}
    </button>
);

// Thumbnail with a scene pager — shows one scene's wireframe at a time and lets
// you flip through every scene in the layout without opening it. Clicking the
// thumbnail itself still triggers the card action (open / add).
const ScenePreview = ({ scenes = [], startIndex = 0, theme, onOpen, openTitle, children }) => {
    const [idx, setIdx] = useState(startIndex);
    const n = scenes.length;
    const i = n > 0 ? Math.min(Math.max(idx, 0), n - 1) : 0;
    const scene = scenes[i];
    const step = (d) => setIdx(((i + d) % n + n) % n);

    return (
        <div style={{ position: 'relative', cursor: onOpen ? 'pointer' : 'inherit' }} onClick={onOpen} title={openTitle}>
            <Thumb snapshot={scene?.snapshot} fallbackTheme={theme} />
            {/* Scene strip: name + ‹ i/n › pager over a bottom scrim */}
            <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                padding: '12px 5px 4px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.78))',
                borderRadius: '0 0 8px 8px',
            }}>
                <span style={{ fontSize: 8, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scene?.name ?? '—'}
                </span>
                {n > 1 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <PagerBtn onClick={() => step(-1)} title="Previous scene"><ChevronLeft size={11} /></PagerBtn>
                        <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)', minWidth: 20, textAlign: 'center' }}>{i + 1}/{n}</span>
                        <PagerBtn onClick={() => step(1)} title="Next scene"><ChevronRight size={11} /></PagerBtn>
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

// Shared card shell for the list pane. Clicking selects; the side panel then
// shows the big preview and the Open / Use action.
const Card = ({ active, selected, onSelect, children }) => {
    const [hover, setHover] = useState(false);
    const accent = selected ? 'rgba(165,180,252,0.9)' : active ? 'rgba(99,102,241,0.5)' : hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)';
    return (
        <div
            onClick={onSelect}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 6, borderRadius: 10, cursor: 'pointer',
                background: selected ? 'rgba(99,102,241,0.14)' : hover ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${accent}`, boxShadow: selected ? '0 0 0 1px rgba(165,180,252,0.35)' : 'none',
                transition: 'background 0.12s, border-color 0.12s',
            }}
        >
            {children(hover)}
        </div>
    );
};

const ActiveBadge = () => (
    <span style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(79,70,229,0.85)', borderRadius: 5, padding: '2px 6px', fontSize: 8, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>
        <Check size={9} /> Active
    </span>
);

// Templates open on their busiest scene, so the component-rich showcases lead
// with the wheel / pet / goals. Ties keep the first scene: gameplay scenes are
// transparent (the game shows through in OBS) and read as empty in a thumbnail.
const richestScene = (scenes = []) => scenes.reduce((best, sc, i) => {
    const s = sc.snapshot ?? {};
    const vis = s.boxVisibility ?? {};
    const score = (s.elements ?? []).filter(e => !e.hidden).length + 2 * Object.keys(s.boxes ?? {}).filter(id => vis[id]).length;
    return score > best.score ? { i, score } : best;
}, { i: 0, score: -1 }).i;

const startSceneOf = (kind, item) => {
    const scenes = item.scenes ?? [];
    return kind === 'mine'
        ? Math.max(0, scenes.findIndex(s => s.id === item.activeSceneId))
        : richestScene(scenes);
};

const LayoutCard = ({ layout, active, selected, onSelect, onRename, onDelete }) => {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(layout.name);
    const [confirmDel, setConfirmDel] = useState(false);

    const commitName = () => { onRename(layout.id, name); setEditing(false); };
    const scenes = layout.scenes ?? [];

    return (
        <Card active={active} selected={selected} onSelect={onSelect}>{(hover) => (<>
            <ScenePreview scenes={scenes} startIndex={startSceneOf('mine', layout)}>
                {active && <ActiveBadge />}
            </ScenePreview>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22, padding: '0 2px' }} onClick={e => e.stopPropagation()}>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setName(layout.name); setEditing(false); } }}
                        style={{
                            flex: 1, minWidth: 0, background: '#15152a', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 5,
                            color: '#fff', fontSize: 11, padding: '3px 6px', outline: 'none', fontFamily: 'inter, system-ui',
                        }}
                    />
                ) : (
                    <span
                        onClick={() => setEditing(true)}
                        title="Click to rename"
                        style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 600, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {layout.name}
                    </span>
                )}
                {confirmDel ? (
                    <button onClick={() => onDelete(layout.id)} onMouseLeave={() => setConfirmDel(false)} title="Click to confirm delete"
                        style={{ flexShrink: 0, padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', cursor: 'pointer' }}>
                        Delete?
                    </button>
                ) : (
                    <button onClick={() => setConfirmDel(true)} title="Delete layout"
                        style={{ flexShrink: 0, display: 'flex', padding: 3, borderRadius: 5, background: 'none', border: 'none', color: hover ? 'rgba(252,165,165,0.8)' : 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        </>)}</Card>
    );
};

// A starter is a ready-made template (not yet a saved layout). Adding it builds
// a real, editable layout from its scenes.
const StarterCard = ({ starter, selected, onSelect }) => (
    <Card selected={selected} onSelect={onSelect}>{() => (<>
        <ScenePreview scenes={starter.scenes} startIndex={startSceneOf('templates', starter)} theme={starter.themeId} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 2px 2px' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {starter.name}
            </span>
            <span title={starter.tagline} style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {starter.tagline}
            </span>
        </div>
    </>)}</Card>
);

// Side panel: big preview of the selected layout/template, its scenes as a
// 2-column grid to flip the big preview, and the primary action.
const DetailPanel = ({ kind, item, active, onPrimary }) => {
    const scenes = item.scenes ?? [];
    const [idx, setIdx] = useState(() => startSceneOf(kind, item));
    const i = Math.min(idx, Math.max(0, scenes.length - 1));
    const theme = kind === 'templates' ? item.themeId : undefined;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <div style={{ position: 'relative' }}>
                <Thumb snapshot={scenes[i]?.snapshot} fallbackTheme={theme} />
                {active && <ActiveBadge />}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                        {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}{item.tagline ? ` · ${item.tagline}` : ''}
                    </div>
                </div>
                <button onClick={onPrimary} style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    background: '#f1f1f5', border: 'none', color: '#0b0b12',
                    fontSize: 10, fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                    {kind === 'templates' ? <><Plus size={12} /> Use template</> : <><Check size={12} /> {active ? 'Reload' : 'Open'}</>}
                </button>
            </div>

            {scenes.length > 1 && (
                <>
                    <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)' }}>Scenes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                        {scenes.map((sc, j) => (
                            <button key={sc.id ?? j} onClick={() => setIdx(j)} style={{
                                display: 'flex', flexDirection: 'column', gap: 4, padding: 4, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                                background: j === i ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${j === i ? 'rgba(165,180,252,0.7)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                                <Thumb snapshot={sc.snapshot} fallbackTheme={theme} />
                                <span style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, color: j === i ? '#fff' : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                                    {sc.name ?? `Scene ${j + 1}`}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const TabBtn = ({ active, onClick, children, count }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
        border: `1px solid ${active ? 'rgba(255,255,255,0.14)' : 'transparent'}`,
        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
        fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.2,
    }}>
        {children}
        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 999, background: active ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)', color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}>{count}</span>
    </button>
);

const LIST_GRID = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 };

const LayoutGallery = ({ layouts = [], activeLayoutId, starters = [], onAddStarter, onClose, onCreate, onSwitch, onRename, onDelete }) => {
    const [newName, setNewName] = useState('');
    const hasStarters = starters.length > 0 && !!onAddStarter;
    // Land on your own layouts once you have some; first-timers see templates.
    const [tab, setTab] = useState(layouts.length > 0 || !hasStarters ? 'mine' : 'templates');
    const [selectedId, setSelectedId] = useState({ mine: activeLayoutId ?? layouts[0]?.id, templates: starters[0]?.id });

    const create = () => { onCreate(newName); setNewName(''); };

    const list = tab === 'mine' ? layouts : starters;
    const selected = list.find(x => x.id === selectedId[tab]) ?? list[0] ?? null;
    const select = (id) => setSelectedId(s => ({ ...s, [tab]: id }));
    const primary = () => {
        if (!selected) return;
        if (tab === 'templates') { onAddStarter(selected); setTab('mine'); }
        else onSwitch(selected.id);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                style={{
                    width: 'min(1120px, 100%)', height: 'min(760px, 90vh)', display: 'flex', flexDirection: 'column',
                    background: 'rgba(12,12,22,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, boxShadow: '0 20px 70px rgba(0,0,0,0.7)', overflow: 'hidden',
                }}
            >
                {/* Header — tabs */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                    padding: '10px 12px 10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')} count={layouts.length}>Your layouts</TabBtn>
                        {hasStarters && <TabBtn active={tab === 'templates'} onClick={() => setTab('templates')} count={starters.length}>Templates</TabBtn>}
                    </div>
                    <button onClick={onClose} title="Close" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>

                {tab === 'mine' && (
                    /* New layout — snapshots the current canvas as its first scene */
                    <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') create(); }}
                            placeholder="New layout name (e.g. Valorant Stream)…"
                            style={{
                                flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 7, color: '#fff', fontSize: 12, padding: '7px 10px', outline: 'none', fontFamily: 'inter, system-ui',
                            }}
                        />
                        <button
                            onClick={create}
                            title="Create a new layout from the current canvas"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', borderRadius: 7,
                                background: 'rgba(79,70,229,0.5)', border: '1px solid rgba(99,102,241,0.5)', color: '#fff',
                                fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            <Plus size={13} /> New layout
                        </button>
                    </div>
                )}

                {/* Body — list (2 columns) | preview. Wraps to a single column on narrow screens. */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexWrap: 'wrap', overflowY: 'auto' }}>
                    <div style={{ flex: '1 1 380px', minWidth: 0, maxHeight: '100%', overflowY: 'auto', padding: 14, boxSizing: 'border-box' }}>
                        {list.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.8, padding: '60px 20px' }}>
                                No saved layouts yet.<br />
                                {hasStarters && <>Pick one from <button onClick={() => setTab('templates')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6ee7b7', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>Templates</button>, or name</>}
                                {!hasStarters && 'Name'} one above and hit <span style={{ color: '#a5b4fc' }}>New layout</span> to capture the current canvas.
                            </div>
                        ) : (
                            <div style={LIST_GRID}>
                                {tab === 'templates'
                                    ? starters.map(st => <StarterCard key={st.id} starter={st} selected={st.id === selected?.id} onSelect={() => select(st.id)} />)
                                    : layouts.map(l => (
                                        <LayoutCard
                                            key={l.id}
                                            layout={l}
                                            active={l.id === activeLayoutId}
                                            selected={l.id === selected?.id}
                                            onSelect={() => select(l.id)}
                                            onRename={onRename}
                                            onDelete={onDelete}
                                        />
                                    ))}
                            </div>
                        )}
                    </div>

                    {selected && (
                        <div style={{ flex: '1 1 420px', minWidth: 0, maxHeight: '100%', overflowY: 'auto', padding: 16, boxSizing: 'border-box', borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
                            <DetailPanel
                                key={`${tab}:${selected.id}`}
                                kind={tab}
                                item={selected}
                                active={tab === 'mine' && selected.id === activeLayoutId}
                                onPrimary={primary}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LayoutGallery;
