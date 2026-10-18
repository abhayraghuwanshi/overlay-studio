import { motion } from 'framer-motion';
import { ChevronUp, Eye, Film, GripHorizontal, HelpCircle, Home, LayoutGrid, Pencil, Play, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

// In-app guide to the studio: what each dock button does, what you can do in
// edit mode, and how to get the overlay into OBS. Opened from the "?" in the
// dock / edit header, and once automatically on a first visit (see OverlayLayout).

const REQUEST_URL = 'https://github.com/abhayraghuwanshi/overlay-studio/issues/new/choose';

// Lookalike of the real dock / header button, so the guide reads "this one".
const Key = ({ children, accent }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, flexShrink: 0,
        fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1, whiteSpace: 'nowrap',
        border: `1px solid ${accent ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`,
        background: accent ? 'rgba(79,70,229,0.45)' : 'rgba(255,255,255,0.04)',
        color: accent ? '#fff' : 'rgba(255,255,255,0.7)',
    }}>
        {children}
    </span>
);

const Row = ({ k, title, children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 132px) minmax(0, 1fr)', gap: 14, alignItems: 'start', padding: '11px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{k}</div>
        <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{title}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{children}</div>
        </div>
    </div>
);

const Step = ({ n, children }) => (
    <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,70,229,0.45)', border: '1px solid rgba(99,102,241,0.5)', color: '#fff', fontSize: 10, fontFamily: 'monospace' }}>{n}</span>
        <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', paddingTop: 2 }}>{children}</div>
    </div>
);

const B = ({ children }) => <b style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>{children}</b>;

const Dock = () => (
    <>
        <p style={{ margin: '0 0 6px', fontSize: 11.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
            The bar at the bottom of the screen. It's how you get around when you're not editing.
        </p>
        <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', padding: '8px 0 2px' }}>Tools</div>
        <Row k={<Key><Home size={11} /></Key>} title="Home">
            Back to the Overlay Studio home page. Your overlay stays saved.
        </Row>
        <Row k={<Key><Pencil size={11} /></Key>} title="Edit layout">
            Opens the editor: add, move and resize things on the canvas. See the <B>Edit mode</B> tab.
        </Row>
        <Row k={<Key accent><Play size={11} /> Go live</Key>} title="Get your OBS link">
            Creates your private room and copies the OBS link. After that it says <B>Copy link</B> so you can grab it again.
        </Row>
        <Row k={<Key><HelpCircle size={11} /></Key>} title="This guide">
            Open it any time from the dock or the editor's top bar.
        </Row>
        <Row k={<><Key><ChevronUp size={11} style={{ transform: 'rotate(180deg)' }} /></Key><Key><GripHorizontal size={11} /></Key></>} title="Hide / show the dock">
            Tucks the dock into a small handle for a clean preview. Click the handle to bring it back. OBS never shows the dock.
        </Row>
        <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', padding: '14px 0 2px' }}>Your show (after the divider)</div>
        <Row k={<Key><LayoutGrid size={11} /></Key>} title="Layouts & templates">
            A layout is a whole show with its own scenes. Open one of yours, or pick from <B>Templates</B>: click to preview, then <B>Use template</B>.
        </Row>
        <Row k={<Key><Film size={11} /> Scene <ChevronUp size={10} style={{ opacity: 0.6 }} /></Key>} title="Switch scene">
            The scene you're on. Click it to jump between this layout's scenes (Starting soon, Just chatting, BRB, Ending…). OBS switches with you.
        </Row>
    </>
);

const Edit = () => (
    <>
        <p style={{ margin: '0 0 6px', fontSize: 11.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
            Everything you change saves on its own and shows up in OBS within a couple of seconds.
        </p>
        <Row k={<Key><Plus size={11} /> Add to scene</Key>} title="The toolbox (left)">
            Text, lower thirds, clocks, countdowns, goals, socials, pets, a spin wheel, scoreboards, shapes and more. Search at the top, click one, then <B>click or drag on the canvas</B> to place it. <B>Esc</B> cancels.
        </Row>
        <Row k={<Key>Drag · Resize</Key>} title="Arrange the canvas">
            Drag a box by its top bar to move it, pull a corner to resize. Click a box to open its settings on the right (text, colors, timer, frame…).
        </Row>
        <Row k={<><Key><Eye size={11} /></Key><Key><ChevronUp size={11} /></Key><Key><Trash2 size={11} /></Key></>} title="Layers in this scene (under the canvas)">
            Every layer, front to back. Click one to select it; hover for hide/show, bring forward or send backward, and remove.
        </Row>
        <Row k={<Key><Film size={11} /> Scenes</Key>} title="Pick the scene you're editing">
            The dropdown at the top of the left panel. Each scene is its own full design.
        </Row>
        <Row k={<Key><Save size={11} /> Save scene</Key>} title="Save as a new scene">
            Saves the current canvas as a new scene in this layout, for example a BRB version of your main scene.
        </Row>
        <Row k={<><Key>Theme</Key><Key>BG</Key></>} title="Look & background">
            <B>Theme</B> re-skins every element at once (colors, font, corners). <B>BG</B> sets the background: solid, gradient, image, or transparent so your game shows through.
        </Row>
        <Row k={<Key><RotateCcw size={11} /> Reset</Key>} title="Reset positions">
            Moves the cameras and built-in boxes back to their default spots. Elements you added stay where they are.
        </Row>
        <Row k={<Key accent>Done</Key>} title="Leave the editor">
            Back to the clean preview with the dock.
        </Row>
    </>
);

const Obs = () => (
    <>
        <Step n={1}>In the dock, click <B>Go live</B>. Your private OBS link is copied.</Step>
        <Step n={2}>In OBS, go to <B>Sources → + → Browser</B> and click OK.</Step>
        <Step n={3}>Paste the link as the <B>URL</B>, set width <B>1920</B> and height <B>1080</B>, leave Custom CSS empty, and click OK.</Step>
        <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>
            Using <B>Streamlabs Desktop</B>, <B>XSplit</B> or <B>Meld</B>? Add a Browser / Web page source with the same link and size. Stream to YouTube, Twitch, Kick or anywhere your app supports, and the overlay goes along.
        </p>
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>
            <B>Webcam:</B> add it in OBS as a normal <B>Video Capture Device</B> behind the overlay. To have it snap into the camera frame automatically, turn on <B>Tools → WebSocket Server Settings</B> in OBS (port 4455, authentication off).
            <br /><B>Keep your link private:</B> anyone who has it can edit your overlay.
        </div>
    </>
);

const TABS = [
    { id: 'dock', label: 'The dock', Body: Dock },
    { id: 'edit', label: 'Edit mode', Body: Edit },
    { id: 'obs', label: 'Add to OBS', Body: Obs },
];

const HelpPanel = ({ onClose, initialTab = 'dock' }) => {
    const [tab, setTab] = useState(initialTab);
    const { Body } = TABS.find(t => t.id === tab) ?? TABS[0];

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                role="dialog" aria-label="How the studio works"
                style={{
                    width: 'min(560px, 100%)', height: 'min(640px, 88vh)', display: 'flex', flexDirection: 'column',
                    background: 'rgba(12,12,22,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, boxShadow: '0 20px 70px rgba(0,0,0,0.7)', overflow: 'hidden', fontFamily: 'inter, system-ui',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.75)' }}>How it works</span>
                    <button onClick={onClose} title="Close" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 4, padding: '12px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                            background: tab === t.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                            border: `1px solid ${tab === t.id ? 'rgba(255,255,255,0.14)' : 'transparent'}`,
                            color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
                            fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.2,
                        }}>{t.label}</button>
                    ))}
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 16px 14px' }}>
                    <Body />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <a href={REQUEST_URL} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#a5b4fc', textDecoration: 'none' }}>
                        Missing something? Request it ↗
                    </a>
                    <button onClick={onClose} style={{ padding: '6px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(79,70,229,0.5)', border: '1px solid rgba(99,102,241,0.5)', color: '#fff', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Got it
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default HelpPanel;
