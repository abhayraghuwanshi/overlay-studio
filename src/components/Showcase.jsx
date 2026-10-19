import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { STARTER_LAYOUTS } from '../scenes/starterLayouts';
import { getTheme } from '../theme/themes';
import { bgToStyle } from './BackgroundPanel';
import CameraFrame from './CameraFrame';
import ElementRenderer from './ElementRenderer';
import { holeMask, sceneHoles } from './graphics';

// Showcase / promo mode — plays template scenes full-screen at 1920×1080 with
// an intro card, captions, crossfades and an end card, for recording promo
// videos (see scripts/record-showcase.mjs). It stands in for what OBS would
// put under the overlay: a placeholder webcam in camera slots and a generic
// "game" under transparent scenes and game-capture windows.
//
//   ?showcase&packs=kit-valhalla,kit-samurai   which starters (default: new ones)
//   &scenes=0,2                                  scene indexes per pack (default: all)
//   &sec=3.5                                     seconds per scene
//   &vertical                                    1080×1920 layout for Shorts / TikTok / Reels
//   &autostart                                   play immediately (else wait for window.__showcaseStart())

const W = 1920, H = 1080;
const VW = 1080, VH = 1920;     // vertical canvas
const V_STAGE = VW / W;          // 16:9 overlay scaled to the vertical width
const INTRO_MS = 2200, OUTRO_MS = 3000, FADE_S = 0.45;
const ALERT_TYPES = ['sub', 'raid', 'giftbomb', 'cheer', 'resub'];

const params = () => new URLSearchParams(window.location.search);

const buildSteps = () => {
    const p = params();
    const ids = (p.get('packs') || '').split(',').map(s => s.trim()).filter(Boolean);
    const packs = ids.length
        ? ids.map(id => STARTER_LAYOUTS.find(st => st.id === id)).filter(Boolean)
        : STARTER_LAYOUTS.filter(st => st.isNew);
    const sceneSel = (p.get('scenes') || '').split(',').filter(Boolean).map(Number).filter(n => Number.isInteger(n));
    return packs.flatMap(st => (sceneSel.length ? sceneSel : st.scenes.map((_, i) => i))
        .filter(i => st.scenes[i])
        .map(i => ({ starter: st, index: i, scene: st.scenes[i] })));
};

// ── Stand-ins for the OBS sources under the overlay ─────────────────────────

// A generic, made-up game world: layered hills, a sun and drifting clouds.
const FakeGame = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #2b5876 0%, #4e4376 55%, #f2994a 100%)' }}>
        <div style={{ position: 'absolute', left: '62%', top: '30%', width: 220, height: 220, borderRadius: '50%', background: '#ffd27a', boxShadow: '0 0 120px #ffb347' }} />
        {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', top: `${12 + i * 9}%`, left: 0, width: '100%', animation: `batFly ${60 + i * 25}s linear ${-i * 20}s infinite` }}>
                <div style={{ width: 260 - i * 50, height: 60 - i * 10, borderRadius: 60, background: 'rgba(255,255,255,0.55)', filter: 'blur(6px)' }} />
            </div>
        ))}
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path d="M0 700 Q240 560 480 660 T960 620 T1440 650 T1920 600 V1080 H0Z" fill="#3b3a6b" />
            <path d="M0 800 Q300 700 600 780 T1200 760 T1920 740 V1080 H0Z" fill="#26284d" />
            <path d="M0 900 Q360 840 720 890 T1440 870 T1920 880 V1080 H0Z" fill="#15172e" />
        </svg>
        {/* tiny HUD so it reads as gameplay */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 34, height: 34, marginLeft: -17, marginTop: -17, border: '2px solid rgba(255,255,255,0.7)', borderRadius: '50%' }} />
    </div>
);

// Placeholder streamer: soft room light and a silhouette that gently breathes.
const FakeCam = () => (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'radial-gradient(ellipse at 30% 20%, #5a4a7a, #1d1830 70%)' }}>
        <div style={{ position: 'absolute', right: '12%', top: '10%', width: '22%', height: '30%', borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,214,150,0.35), rgba(255,214,150,0.08))' }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '88%', animation: 'petBreathe 4s ease-in-out infinite', transformOrigin: 'bottom center' }}>
            <circle cx="50" cy="38" r="15" fill="#0e0b18" opacity="0.9" />
            <path d="M18 100 Q20 62 50 58 Q80 62 82 100 Z" fill="#0e0b18" opacity="0.9" />
        </svg>
    </div>
);

const CAM_SLOTS = ['faceCam', 'handCam', 'roomCam'];

const Scene = ({ step }) => {
    const { starter, scene } = step;
    const snap = scene.snapshot;
    const theme = getTheme(snap.theme ?? starter.themeId);
    const vis = snap.boxVisibility ?? {};
    const holes = sceneHoles(snap, theme);
    const opaque = snap.background && snap.background.type !== 'transparent';

    // Fire an alert shortly after the scene appears so the video shows one.
    const [elements, setElements] = useState(snap.elements ?? []);
    useEffect(() => {
        const t = setTimeout(() => {
            const type = ALERT_TYPES[(starter.id.length + step.index) % ALERT_TYPES.length];
            setElements(els => els.map(e => (e.type === 'alerts' ? { ...e, test: { type, at: Date.now() } } : e)));
        }, 700);
        return () => clearTimeout(t);
    }, [starter.id, step.index]);
    const mood = elements.find(e => e.type === 'moodring')?.mood ?? 'chill';
    const needsGame = !opaque || holes.length > 0;

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
            {needsGame && <FakeGame />}
            {opaque && <div style={{ position: 'absolute', inset: 0, ...bgToStyle(snap.background), ...holeMask(holes) }} />}
            {CAM_SLOTS.filter(id => vis[id] && snap.boxes?.[id]).map(id => {
                const b = snap.boxes[id];
                const cs = snap.camStyles?.[id] ?? { frame: 'none' };
                return (
                    <div key={id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: 10 }}>
                        <CameraFrame frame={cs.frame} radius={cs.radius} accent={theme.accent} accent2={theme.accent2}><FakeCam /></CameraFrame>
                    </div>
                );
            })}
            {elements.filter(e => !e.hidden && e.box).map((e, i) => (
                <div key={e.id} style={{ position: 'absolute', left: `${e.box.x}%`, top: `${e.box.y}%`, width: `${e.box.w}%`, height: `${e.box.h}%`, overflow: 'hidden', zIndex: 100 + (elements.length - 1 - i) }}>
                    <ElementRenderer element={e} theme={theme} mood={mood} preview holes={e.type === 'backdrop' ? holes : undefined} />
                </div>
            ))}
        </div>
    );
};

const Caption = ({ step }) => {
    const theme = getTheme(step.starter.themeId);
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{
                position: 'absolute', left: 40, top: 40, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 20px 12px 14px', borderRadius: 14, background: 'rgba(8,8,16,0.82)', border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)', fontFamily: "'Space Grotesk', Inter, sans-serif", color: '#fff',
            }}
        >
            <span style={{ width: 14, height: 40, borderRadius: 4, background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent2})` }} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: 26, fontWeight: 700 }}>{step.starter.name}</span>
                <span style={{ fontSize: 17, opacity: 0.65 }}>{step.scene.name}</span>
            </span>
        </motion.div>
    );
};

const Card = ({ title, sub, foot, vertical = false }) => (
    <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
        background: 'radial-gradient(ellipse at 50% 40%, #1d1b4b, #07070f 70%)', color: '#fff', fontFamily: "'Space Grotesk', Inter, sans-serif", textAlign: 'center',
    }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ fontSize: vertical ? 120 : 104, fontWeight: 700, letterSpacing: -2, lineHeight: 1.02, maxWidth: vertical ? 900 : 'none' }}>{title}</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ fontSize: vertical ? 44 : 38, maxWidth: vertical ? 860 : 'none', lineHeight: 1.3 }}>{sub}</motion.div>
        {foot && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.6 }}
                style={{ marginTop: 18, padding: '14px 30px', borderRadius: 999, background: '#f1f1f5', color: '#0b0b12', fontSize: 30, fontWeight: 700 }}>{foot}</motion.div>
        )}
    </div>
);

// Vertical (9:16) frame: big pack name up top, the 16:9 overlay in the middle,
// a call to action below — readable on a phone, unlike a letterboxed 16:9.
const VerticalFrame = ({ step }) => {
    const theme = getTheme(step.starter.themeId);
    return (
        <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', color: '#fff', fontFamily: "'Space Grotesk', Inter, sans-serif",
            background: `radial-gradient(ellipse at 50% 30%, ${theme.accent}33, transparent 60%), radial-gradient(ellipse at 50% 85%, ${theme.accent2}26, transparent 55%), #07070f`,
        }}>
            <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 30, letterSpacing: 8, textTransform: 'uppercase', opacity: 0.6 }}>Overlay Studio</div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}
                    style={{ fontSize: 108, fontWeight: 700, letterSpacing: -2, marginTop: 34, lineHeight: 1 }}>
                    {step.starter.name}
                </motion.div>
                <div style={{ width: 120, height: 8, borderRadius: 4, margin: '34px auto 0', background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
                <div style={{ fontSize: 44, marginTop: 30, opacity: 0.8 }}>{step.scene.name}</div>
            </div>
            <div style={{
                position: 'absolute', left: 0, top: 640, width: VW, height: H * V_STAGE, overflow: 'hidden',
                boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 0 2px ${theme.accent}55`,
            }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${V_STAGE})`, transformOrigin: 'top left' }}>
                    <Scene step={step} />
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: 210, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 40, opacity: 0.8 }}>{step.starter.tagline}</div>
                <div style={{ display: 'inline-block', marginTop: 40, padding: '18px 40px', borderRadius: 999, background: '#f1f1f5', color: '#0b0b12', fontSize: 38, fontWeight: 700 }}>
                    Free · streamoverlay.kazekit.com
                </div>
            </div>
        </div>
    );
};

const Showcase = () => {
    const steps = useMemo(() => buildSteps(), []);
    const sec = Math.max(1.5, Number(params().get('sec')) || 3.5);
    // phase: 'wait' → 'intro' → step index (number) → 'outro' → 'done'
    const [phase, setPhase] = useState(params().has('autostart') ? 'intro' : 'wait');
    const vertical = params().has('vertical');
    const [fw, fh] = vertical ? [VW, VH] : [W, H];
    const [scale, setScale] = useState(() => Math.min(window.innerWidth / fw, window.innerHeight / fh));

    useEffect(() => {
        const onResize = () => setScale(Math.min(window.innerWidth / fw, window.innerHeight / fh));
        window.addEventListener('resize', onResize);
        window.__showcaseStart = () => setPhase('intro');
        window.__showcaseInfo = { steps: steps.length, sec, introMs: INTRO_MS, outroMs: OUTRO_MS };
        return () => window.removeEventListener('resize', onResize);
    }, [steps.length, sec, fw, fh]);

    useEffect(() => {
        window.__showcaseDone = phase === 'done';
        if (phase === 'wait' || phase === 'done') return undefined;
        const ms = phase === 'intro' ? INTRO_MS : phase === 'outro' ? OUTRO_MS : sec * 1000;
        const next = phase === 'intro' ? (steps.length ? 0 : 'outro')
            : phase === 'outro' ? 'done'
            : phase + 1 < steps.length ? phase + 1 : 'outro';
        const t = setTimeout(() => setPhase(next), ms);
        return () => clearTimeout(t);
    }, [phase, sec, steps.length]);

    const key = typeof phase === 'number' ? `s${phase}` : phase;
    const step = typeof phase === 'number' ? steps[phase] : null;
    const count = new Set(STARTER_LAYOUTS.map(s => s.id)).size;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: fw, height: fh, transform: `translate(-50%, -50%) scale(${scale})`, overflow: 'hidden' }}>
                <AnimatePresence mode="sync">
                    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: FADE_S }}
                        style={{ position: 'absolute', inset: 0 }}>
                        {(phase === 'wait' || phase === 'intro') && <Card vertical={vertical} title="Overlay Studio" sub="Free stream overlays for OBS — design in your browser" />}
                        {step && (vertical ? <VerticalFrame step={step} /> : <><Scene step={step} /><Caption step={step} /></>)}
                        {(phase === 'outro' || phase === 'done') && <Card vertical={vertical} title={`${count} free templates`} sub="Twitch chat · alerts · animated scenes · one link into OBS" foot="streamoverlay.kazekit.com" />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Showcase;
