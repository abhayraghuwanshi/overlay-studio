import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BUILTIN_LAYERS, ELEMENT_TYPE_MAP } from './elementCatalog';

// Every layer in the current scene, as a grid of cards under the editor canvas
// (where the 16:9 canvas leaves free space). Front-most first, like the canvas
// stacking. The left panel is just the Add toolbox now.

const ActionBtn = ({ title, onClick, danger, children }) => (
    <button
        title={title}
        aria-label={title}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        style={{
            width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, padding: 0, cursor: 'pointer', background: 'transparent', border: '1px solid transparent',
            color: 'rgba(255,255,255,0.4)', transition: 'all 0.1s',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = danger ? '#fca5a5' : '#fff';
        }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
    >
        {children}
    </button>
);

const LayerCard = ({ icon, label, kind, color, visible, selected, onSelect, onToggle, onUp, onDown, onRemove }) => {
    const [hover, setHover] = useState(false);
    const showActions = hover || selected;
    return (
        <div
            onClick={onSelect}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '6px 6px 6px 6px', borderRadius: 10,
                cursor: 'pointer', userSelect: 'none',
                background: selected ? 'rgba(99,102,241,0.16)' : hover ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${selected ? 'rgba(165,180,252,0.6)' : hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'background 0.1s, border-color 0.1s',
            }}
        >
            <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 8, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                background: `linear-gradient(145deg, ${color}26, ${color}0a)`, boxShadow: `inset 0 0 0 1px ${color}2e`,
                opacity: visible ? 1 : 0.4, filter: visible ? 'none' : 'grayscale(1)',
            }}>
                <span style={{ display: 'flex', transform: 'scale(0.8)' }}>{icon}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: visible ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: visible ? 'none' : 'line-through' }}>
                    {label}
                </span>
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {visible ? kind : `${kind} · hidden`}
                </span>
            </span>
            {/* Actions only on hover / selection, so names get the full width otherwise. */}
            <span style={{ display: showActions ? 'flex' : 'none', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                {onToggle && (
                    <ActionBtn title={visible ? 'Hide' : 'Show'} onClick={onToggle}>
                        {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </ActionBtn>
                )}
                <ActionBtn title="Bring forward" onClick={onUp}><ChevronUp size={13} /></ActionBtn>
                <ActionBtn title="Send backward" onClick={onDown}><ChevronDown size={13} /></ActionBtn>
                <ActionBtn title="Remove" danger onClick={onRemove}><Trash2 size={12} /></ActionBtn>
            </span>
        </div>
    );
};

// Text-ish elements are named by their content, everything else by its type —
// non-text types still carry the base placeholder content ("New Title").
const NAMED_BY_CONTENT = new Set(['text', 'lowerthird', 'social', 'goal', 'liquidgoal', 'ticker', 'daycounter', 'live', 'note']);
const firstLine = (v) => String(v ?? '').split('\n').find(l => l.trim())?.trim() ?? '';

const LayerStrip = ({
    boxVisibility = {}, zOrder = [], elements = [], selectedBox, selectedElementId,
    onSelectBox, onLayerUp, onLayerDown, onRemoveBuiltin,
    onSelectElement, onToggleElement, onElementUp, onElementDown, onDeleteElement,
    narrow,
}) => {
    // Higher index in zOrder = rendered on top = listed first.
    const builtins = BUILTIN_LAYERS
        .filter(l => boxVisibility[l.id])
        .sort((a, b) => zOrder.indexOf(b.id) - zOrder.indexOf(a.id));
    const total = builtins.length + elements.length;
    const visible = builtins.length + elements.filter(e => !e.hidden).length;

    return (
        <div style={{ marginTop: narrow ? 10 : 16, fontFamily: 'inter, system-ui, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2.5, color: 'rgba(255,255,255,0.5)' }}>Layers in this scene</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)' }}>{visible}/{total} visible</span>
                </div>
                {total > 1 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Front → back</span>}
            </div>

            {total === 0 ? (
                <div style={{ padding: '18px 12px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
                    No layers yet. Pick something from the toolbox on the left, then click or drag on the canvas.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${narrow ? 150 : 190}px, 1fr))`, gap: 6 }}>
                    {builtins.map(l => (
                        <LayerCard
                            key={l.id}
                            icon={<l.Icon size={16} color={l.color} />}
                            label={l.label}
                            kind={l.id.endsWith('Cam') ? 'Camera' : 'Component'}
                            color={l.color}
                            visible
                            selected={selectedBox === l.id}
                            onSelect={() => onSelectBox(l.id)}
                            onUp={() => onLayerUp?.(l.id)}
                            onDown={() => onLayerDown?.(l.id)}
                            onRemove={() => onRemoveBuiltin(l.id)}
                        />
                    ))}
                    {elements.map(el => {
                        const t = ELEMENT_TYPE_MAP[el.type];
                        const kind = t?.label ?? el.type;
                        return (
                            <LayerCard
                                key={el.id}
                                icon={t?.preview ?? el.type.charAt(0).toUpperCase()}
                                label={(NAMED_BY_CONTENT.has(el.type) && firstLine(el.content)) || kind}
                                kind={kind}
                                color={t?.color ?? '#6b7280'}
                                visible={!el.hidden}
                                selected={selectedElementId === el.id}
                                onSelect={() => onSelectElement(el.id)}
                                onToggle={() => onToggleElement(el.id)}
                                onUp={() => onElementUp?.(el.id)}
                                onDown={() => onElementDown?.(el.id)}
                                onRemove={() => onDeleteElement(el.id)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LayerStrip;
