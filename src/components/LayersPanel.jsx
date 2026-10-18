import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Layers, Plus, RotateCw, X } from 'lucide-react';
import { useState } from 'react';
import { track } from '../analytics';
import { ADD_SECTIONS, BUILTIN_LAYERS, ELEMENT_TYPE_MAP, SHAPE_ELEMENTS } from './elementCatalog';

// ── Sub-components ────────────────────────────────────────────────────────────

const Divider = () => (
    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
);

const IconBtn = ({ onClick, title, danger, children }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            background: 'none', border: 'none', padding: '2px 2px', cursor: 'pointer', flexShrink: 0,
            color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', borderRadius: 4,
            transition: 'color 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = danger ? '#f87171' : 'rgba(255,255,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
    >
        {children}
    </button>
);

// One row in the unified layers list. Every layer gets reorder (↑↓) + remove;
// elements additionally get an eye (hide/show without removing).
// Toolbox item: icon on a soft tinted tile with a plain label under it. Two per
// row; the label wraps between words only, so nothing is clipped or split.
const AddCard = ({ label, color, preview, onClick }) => (
    <button
        onClick={onClick}
        title={`Add ${label}`}
        style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 6,
            minWidth: 0, padding: '8px 4px 7px',
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
            cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s, transform 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
    >
        <span style={{
            width: 38, height: 30, flexShrink: 0, borderRadius: 8, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: `linear-gradient(145deg, ${color}26, ${color}0a)`, boxShadow: `inset 0 0 0 1px ${color}2e`,
        }}>
            {preview}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.2, textAlign: 'center', fontFamily: 'inter, system-ui, sans-serif', wordBreak: 'keep-all', overflowWrap: 'normal', hyphens: 'none' }}>
            {label}
        </span>
    </button>
);

// Shapes are self-explanatory — icon-only, label on hover.
const ShapeBtn = ({ label, color, preview, onClick }) => (
    <button
        onClick={onClick}
        title={`Add ${label}`}
        aria-label={`Add ${label}`}
        style={{
            height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', color,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.borderColor = `${color}55`; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
        <span style={{ display: 'flex', transform: 'scale(0.85)' }}>{preview}</span>
    </button>
);

const ToolboxLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontFamily: 'inter, system-ui, sans-serif', padding: '10px 4px 6px' }}>
        {children}
    </div>
);

const TOOL_GRID = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 5, padding: '0 2px' };

// ── Scenes (dropdown) ─────────────────────────────────────────────────────────

const SceneDot = ({ color }) => (
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}aa` }} />
);

// Scenes belong to the ACTIVE layout. This switches between them, saves the
// current canvas as a new scene, updates a scene to match the canvas, or
// deletes one. The "Layouts" link opens the gallery to switch which show (layout)
// is active.
const ScenesDropdown = ({ layoutName, scenes = [], activeSceneId, onSwitchScene, onUpdateScene, onDeleteScene, onOpenLayouts }) => {
    const [open, setOpen] = useState(false);

    const active = scenes.find(s => s.id === activeSceneId) ?? null;

    return (
        <div style={{ padding: '0 2px' }}>
            {/* Header: section label + layout (show) switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 3px' }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {layoutName ? `Scenes · ${layoutName}` : 'Scenes'}
                </span>
                <button
                    onClick={onOpenLayouts}
                    title="Switch / manage layouts"
                    style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: 8.5, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}
                >
                    <Layers size={10} /> Layouts
                </button>
            </div>

            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                    padding: '6px 9px', borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.78)', cursor: 'pointer',
                    fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1,
                }}
            >
                {active ? <SceneDot color="#818cf8" /> : <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', flexShrink: 0 }} />}
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
                    {active ? active.name : (scenes.length ? 'Choose a scene…' : 'No scenes yet')}
                </span>
                <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5, flexShrink: 0 }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            marginTop: 4, padding: 4, borderRadius: 8,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', flexDirection: 'column', gap: 1,
                        }}>
                            {scenes.length === 0 && (
                                <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', padding: '6px 7px', lineHeight: 1.5 }}>
                                    No scenes here yet — hit Save Scene in the top bar.
                                </div>
                            )}
                            {scenes.map(s => {
                                const isActive = s.id === activeSceneId;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => { onSwitchScene?.(s.id); setOpen(false); }}
                                        title="Switch to this scene"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 7px',
                                            borderRadius: 6, cursor: 'pointer',
                                            background: isActive ? 'rgba(99,102,241,0.16)' : 'transparent',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <SceneDot color={isActive ? '#818cf8' : '#64748b'} />
                                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)' }}>
                                            {s.name}
                                        </span>
                                        {isActive && (
                                            <IconBtn onClick={(e) => { e.stopPropagation(); onUpdateScene?.(s.id); }} title="Update this scene to match the current canvas"><RotateCw size={10} /></IconBtn>
                                        )}
                                        <IconBtn onClick={(e) => { e.stopPropagation(); onDeleteScene?.(s.id); }} title="Delete scene" danger><X size={11} /></IconBtn>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Main panel ────────────────────────────────────────────────────────────────

const LayersPanel = ({
    // Built-in boxes (add on demand)
    boxVisibility,
    onAddBuiltin,
    // Elements
    onAddElement,
    onPlaceElement,
    // Scenes (of the active layout)
    layoutName,
    scenes = [],
    activeSceneId,
    onSwitchScene,
    onUpdateScene,
    onDeleteScene,
    onOpenLayouts,
    // Background / Theme / Reset
    onOpenBackground,
    onOpenTheme,
    onResetLayout,
}) => {
    const [addQuery, setAddQuery] = useState('');

    const availableBuiltins = BUILTIN_LAYERS.filter(l => !boxVisibility[l.id]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            style={{
                position: 'absolute',
                left: 8, top: 8, bottom: 8,
                width: 192,
                zIndex: 200,
                background: 'rgba(8,8,16,0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                padding: '10px 12px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2.5, color: 'rgba(255,255,255,0.45)' }}>
                    Add to scene
                </span>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>

                {/* ── Scenes ── */}
                <ScenesDropdown
                    layoutName={layoutName}
                    scenes={scenes}
                    activeSceneId={activeSceneId}
                    onSwitchScene={onSwitchScene}
                    onUpdateScene={onUpdateScene}
                    onDeleteScene={onDeleteScene}
                    onOpenLayouts={onOpenLayouts}
                />
                {/* ── Toolbox — always open; current layers live in the strip under the canvas ── */}
                <div>
                            {/* Search — filters every section below */}
                            <div style={{ padding: '6px 2px 0' }}>
                                <input
                                    value={addQuery}
                                    onChange={e => setAddQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Escape') setAddQuery(''); }}
                                    placeholder="Search elements…"
                                    style={{
                                        width: '100%', boxSizing: 'border-box', height: 30, padding: '0 10px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff', fontSize: 11, fontFamily: 'inter, system-ui, sans-serif', outline: 'none',
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'inter, system-ui, sans-serif', padding: '6px 4px 0' }}>
                                Click one, then click or drag on the canvas.
                            </div>
                            {(() => {
                                const q = addQuery.trim().toLowerCase();
                                const hit = (label) => !q || label.toLowerCase().includes(q);
                                const place = (type) => {
                                    // Arm placement (click/drag on canvas) if available, else instant add.
                                    if (onPlaceElement) onPlaceElement(type);
                                    else onAddElement(type);
                                   
                                    setAddQuery('');
                                };
                                const builtins = availableBuiltins.filter(l => hit(l.label));
                                const sections = ADD_SECTIONS
                                    .map(sec => ({ ...sec, items: sec.types.map(t => ELEMENT_TYPE_MAP[t]).filter(t => t && hit(t.label)) }))
                                    .filter(sec => sec.items.length);
                                const shapes = SHAPE_ELEMENTS.filter(t => hit(t.label));
                                const none = !builtins.length && !sections.length && !shapes.length;
                                return (
                                    <>
                                        {builtins.length > 0 && (
                                            <>
                                                <ToolboxLabel>Cameras & components</ToolboxLabel>
                                                <div style={TOOL_GRID}>
                                                    {builtins.map(l => (
                                                        <AddCard
                                                            key={l.id}
                                                            label={l.label}
                                                            color={l.color}
                                                            preview={<l.Icon size={16} color={l.color} />}
                                                            onClick={() => { onAddBuiltin(l.id); setAddQuery(''); }}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {sections.map(sec => (
                                            <div key={sec.title}>
                                                <ToolboxLabel>{sec.title}</ToolboxLabel>
                                                <div style={TOOL_GRID}>
                                                    {sec.items.map(t => (
                                                        <AddCard key={t.type} label={t.label} color={t.color} preview={t.preview} onClick={() => place(t.type)} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {shapes.length > 0 && (
                                            <>
                                                <ToolboxLabel>Shapes</ToolboxLabel>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5, padding: '0 2px' }}>
                                                    {shapes.map(t => (
                                                        <ShapeBtn key={t.type} label={t.label} color={t.color} preview={t.preview} onClick={() => place(t.type)} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {none && (
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'inter, system-ui, sans-serif', padding: '14px 4px 4px', lineHeight: 1.5 }}>
                                                Nothing matches “{addQuery.trim()}”.
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                            <div style={{ height: 8 }} />
                            <a
                                href="https://github.com/abhayraghuwanshi/cool-stream-overlay/issues/new?template=component_request.yml"
                                target="_blank" rel="noreferrer"
                                onClick={() => track('request_click', { location: 'studio_add_panel', template: 'component' })}
                                style={{
                                    display: 'block', textAlign: 'center', margin: '2px 2px 10px', padding: '8px 10px', borderRadius: 10,
                                    border: '1px dashed rgba(165,180,252,0.3)', color: 'rgba(199,210,254,0.85)', textDecoration: 'none',
                                    fontSize: 10.5, fontWeight: 500, lineHeight: 1.35, fontFamily: 'inter, system-ui, sans-serif',
                                }}
                            >
                                Missing something?<br /><span style={{ color: '#a5b4fc' }}>Request a component ↗</span>
                            </a>
                </div>

            </div>

            {/* ── Footer actions ── */}
            <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '8px 8px',
                display: 'flex', gap: 5, flexShrink: 0,
            }}>
                <button
                    onClick={onOpenTheme}
                    style={{
                        flex: 1, padding: '5px 0', borderRadius: 7,
                        background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#a5b4fc', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1,
                        cursor: 'pointer', transition: 'all 0.12s',
                    }}
                >
                    Theme
                </button>
                <button
                    onClick={onOpenBackground}
                    style={{
                        flex: 1, padding: '5px 0', borderRadius: 7,
                        background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)',
                        color: '#7dd3fc', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1,
                        cursor: 'pointer', transition: 'all 0.12s',
                    }}
                >
                    BG
                </button>
                <button
                    onClick={onResetLayout}
                    style={{
                        flex: 1, padding: '5px 0', borderRadius: 7,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1,
                        cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    Reset
                </button>
            </div>
        </motion.div>
    );
};

export default LayersPanel;
