/* eslint-disable react-refresh/only-export-components -- style-kit tables live beside their renderers */
import { useEffect, useState } from 'react';

// Style-kit graphics — the decorative layer that gives a theme its identity
// beyond colour: animated backdrops, headline effects, lower-third plates and
// graphic cam frames. Everything is pure CSS / inline SVG tinted from the theme
// (accent, accent2, panel, text), so one scene re-skins completely when the
// theme changes, and it renders the same in the editor, thumbnails and OBS.
//
// Positions that look random come from a seeded hash, never Math.random, so the
// editor and the OBS browser source draw identical star fields / rain / petals.

const rand = (i, salt = 0) => {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c ?? '');
const rgba = (hex, a) => {
    if (!isHex(hex)) return hex;
    const h = hex.slice(1);
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const fill = { position: 'absolute', inset: 0, pointerEvents: 'none' };

// ── Backdrops ──────────────────────────────────────────────────────────────
// Full-canvas animated scenery for Starting / BRB / Ending / Offline screens.
// Sits under everything else; keep it out of scenes that show an OBS camera,
// since the overlay renders above the camera source.

export const BACKDROPS = [
    { id: 'hudgrid',   label: 'HUD grid' },
    { id: 'synthgrid', label: 'Synth grid' },
    { id: 'scanlines', label: 'CRT scanlines' },
    { id: 'blobs',     label: 'Lava blobs' },
    { id: 'starfield', label: 'Starfield' },
    { id: 'bokeh',     label: 'Bokeh' },
    { id: 'rain',      label: 'Rain' },
    { id: 'code',      label: 'Code rain' },
    { id: 'petals',    label: 'Petals' },
    { id: 'waves',     label: 'Waves' },
    { id: 'paper',     label: 'Paper' },
    { id: 'halftone',  label: 'Halftone' },
    { id: 'sunburst',  label: 'Sunburst' },
    { id: 'embers',    label: 'Embers' },
    { id: 'skyline',   label: 'Neon skyline' },
    { id: 'nightsky',  label: 'Moonlit sky' },
    { id: 'spooky',    label: 'Spooky night' },
    { id: 'paws',      label: 'Paw prints' },
    { id: 'seigaiha',  label: 'Seigaiha waves' },
    { id: 'steam',     label: 'Coffee steam' },
];

const Corner = ({ pos, color, size = 90, w = 3 }) => {
    const [v, h] = pos;   // 't'|'b', 'l'|'r'
    return (
        <div style={{
            position: 'absolute', width: size, height: size,
            [v === 't' ? 'top' : 'bottom']: 28, [h === 'l' ? 'left' : 'right']: 28,
            [`border${v === 't' ? 'Top' : 'Bottom'}`]: `${w}px solid ${color}`,
            [`border${h === 'l' ? 'Left' : 'Right'}`]: `${w}px solid ${color}`,
        }} />
    );
};

const HudGrid = ({ a, b }) => (
    <div style={fill}>
        <div style={{ ...fill, backgroundImage: `linear-gradient(${rgba(a, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(a, 0.07)} 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
        <div style={{ ...fill, background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)` }} />
        {/* Rotating reticle */}
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', left: '50%', top: '50%', width: 760, height: 760, marginLeft: -380, marginTop: -380, opacity: 0.22, animation: 'spinSlow 40s linear infinite' }}>
            <circle cx="100" cy="100" r="96" fill="none" stroke={a} strokeWidth="0.6" strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="78" fill="none" stroke={a} strokeWidth="0.4" strokeDasharray="40 12 4 12" />
            <circle cx="100" cy="100" r="60" fill="none" stroke={b} strokeWidth="0.3" strokeDasharray="1 3" />
        </svg>
        {/* Sweeping scan line */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 120, background: `linear-gradient(180deg, transparent, ${rgba(a, 0.10)} 85%, ${rgba(a, 0.45)} 100%)`, animation: 'hudScan 6s linear infinite' }} />
        {[['t', 'l'], ['t', 'r'], ['b', 'l'], ['b', 'r']].map(p => <Corner key={p.join('')} pos={p} color={rgba(a, 0.7)} />)}
        {[['SYS.ONLINE', { top: 40, left: 140 }], ['SIGNAL ▮▮▮▮▯', { top: 40, right: 140 }], ['LAT 12ms', { bottom: 40, left: 140 }], ['REC ● 1080p60', { bottom: 40, right: 140 }]].map(([t, pos]) => (
            <span key={t} style={{ position: 'absolute', ...pos, fontFamily: "'Orbitron', ui-monospace, monospace", fontSize: 15, letterSpacing: 4, color: rgba(a, 0.6) }}>{t}</span>
        ))}
    </div>
);

// Rung k of the synth floor sits at a power curve of its distance, so rungs
// bunch up at the horizon like a real receding plane.
const FLOOR_RUNGS = 10;
const rungY = (k) => 420 * Math.pow(k / FLOOR_RUNGS, 2.2);

const SynthGrid = ({ a, b }) => (
    <div style={fill}>
        {/* Striped sun, high enough to sit behind the headline, not the timer */}
        <div style={{
            position: 'absolute', left: '50%', top: '7%', width: 400, height: 400, marginLeft: -200, borderRadius: '50%',
            background: `linear-gradient(180deg, ${b}, ${a} 75%)`,
            WebkitMaskImage: 'linear-gradient(180deg, #000 50%, transparent 50%, transparent 54%, #000 54%, #000 62%, transparent 62%, transparent 67%, #000 67%, #000 74%, transparent 74%, transparent 80%, #000 80%, #000 86%, transparent 86%)',
            maskImage: 'linear-gradient(180deg, #000 50%, transparent 50%, transparent 54%, #000 54%, #000 62%, transparent 62%, transparent 67%, #000 67%, #000 74%, transparent 74%, transparent 80%, #000 80%, #000 86%, transparent 86%)',
            boxShadow: `0 0 120px ${rgba(a, 0.45)}`,
        }} />
        {/* Horizon glow */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '66%', height: 3, background: a, boxShadow: `0 0 30px 8px ${rgba(a, 0.6)}` }} />
        {/* Perspective floor, drawn flat in SVG (cheap to composite even with a
            dozen thumbnails on screen): rays from the vanishing point plus
            horizontal rungs whose spacing grows toward the viewer and that
            slide forward with SMIL so the grid scrolls endlessly. */}
        <svg viewBox="0 0 1000 420" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: '66%', width: '100%', height: '34%' }}>
            <g stroke={rgba(a, 0.85)} strokeWidth="1.6" vectorEffect="non-scaling-stroke">
                {Array.from({ length: 25 }, (_, i) => (
                    <line key={`v${i}`} x1="500" y1="0" x2={500 + (i - 12) * 140} y2="420" vectorEffect="non-scaling-stroke" />
                ))}
                {Array.from({ length: FLOOR_RUNGS }, (_, k) => {
                    const ys = Array.from({ length: 7 }, (_, j) => rungY(k + j / 6).toFixed(1)).join(';');
                    return (
                        <line key={`h${k}`} x1="0" x2="1000" y1={rungY(k)} y2={rungY(k)} vectorEffect="non-scaling-stroke">
                            <animate attributeName="y1" values={ys} dur="1.1s" repeatCount="indefinite" />
                            <animate attributeName="y2" values={ys} dur="1.1s" repeatCount="indefinite" />
                        </line>
                    );
                })}
            </g>
        </svg>
    </div>
);

const Scanlines = ({ a }) => (
    <div style={{ ...fill, animation: 'crtFlicker 5s steps(1) infinite' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse at center, ${rgba(a, 0.10)} 0%, transparent 60%)` }} />
        <div style={{ ...fill, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.38) 0px, rgba(0,0,0,0.38) 2px, transparent 2px, transparent 5px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: '18%', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)', animation: 'crtRoll 7s linear infinite' }} />
        <div style={{ ...fill, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)' }} />
    </div>
);

const Blobs = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map(i => {
            const c = i % 2 ? b : a;
            const size = 520 + rand(i, 1) * 420;
            return (
                <div key={i} style={{
                    position: 'absolute', width: size, height: size, borderRadius: '50%',
                    left: `${rand(i, 2) * 80 - 10}%`, top: `${rand(i, 3) * 70 - 15}%`,
                    background: `radial-gradient(circle at 40% 40%, ${rgba(c, 0.55)}, ${rgba(c, 0)} 68%)`,
                    animation: `blobDrift ${16 + i * 5}s ease-in-out ${-i * 3}s infinite`,
                }} />
            );
        })}
    </div>
);

const Starfield = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 90 }, (_, i) => {
            const s = 1.5 + rand(i, 4) * 3.5;
            const c = i % 9 === 0 ? a : i % 13 === 0 ? b : '#ffffff';
            return (
                <span key={i} style={{
                    position: 'absolute', left: `${rand(i, 5) * 100}%`, top: `${rand(i, 6) * 100}%`,
                    width: s, height: s, borderRadius: '50%', background: c, boxShadow: `0 0 ${s * 3}px ${c}`,
                    animation: `twinkle ${2 + rand(i, 7) * 4}s ease-in-out ${-rand(i, 8) * 6}s infinite`,
                }} />
            );
        })}
    </div>
);

const Bokeh = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 22 }, (_, i) => {
            const size = 60 + rand(i, 9) * 180;
            const c = i % 3 === 0 ? b : a;
            return (
                <div key={i} style={{ position: 'absolute', left: `${rand(i, 10) * 100}%`, top: 0, bottom: 0, width: size, animation: `bokehFloat ${14 + rand(i, 11) * 14}s linear ${-rand(i, 12) * 28}s infinite` }}>
                    <div style={{
                        position: 'absolute', top: `${40 + rand(i, 13) * 60}%`, width: size, height: size, borderRadius: '50%',
                        background: `radial-gradient(circle, ${rgba(c, 0.28)}, ${rgba(c, 0.10)} 60%, transparent 70%)`,
                        border: `1px solid ${rgba(c, 0.18)}`,
                    }} />
                </div>
            );
        })}
    </div>
);

// Falling columns share one technique: a full-height wrapper translates 0→100%
// of the canvas (percentages on the wrapper resolve against its own height).
const Faller = ({ i, left, dur, children }) => (
    <div style={{ position: 'absolute', left, top: 0, height: '100%', animation: `fallDown ${dur}s linear ${-rand(i, 14) * dur}s infinite` }}>
        {children}
    </div>
);

const Rain = ({ a }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), transparent 40%, rgba(0,0,0,0.35))' }} />
        {Array.from({ length: 70 }, (_, i) => (
            <Faller key={i} i={i} left={`${rand(i, 15) * 100}%`} dur={0.9 + rand(i, 16) * 1.1}>
                <div style={{ width: 2, height: 60 + rand(i, 17) * 70, borderRadius: 2, background: `linear-gradient(180deg, transparent, ${rgba(a, 0.55)})`, transform: 'rotate(8deg)' }} />
            </Faller>
        ))}
    </div>
);

const GLYPHS = 'アカサタナハマヤラワ0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘ<>/=*+';
const CodeRain = ({ a }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 34 }, (_, i) => {
            const len = 8 + Math.floor(rand(i, 18) * 14);
            const chars = Array.from({ length: len }, (_, k) => GLYPHS[Math.floor(rand(i * 31 + k, 19) * GLYPHS.length)]);
            return (
                <Faller key={i} i={i} left={`${(i / 34) * 100 + rand(i, 20) * 2}%`} dur={6 + rand(i, 21) * 8}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 22, lineHeight: 1.1, transform: 'translateY(-100%)' }}>
                        {chars.map((ch, k) => (
                            <span key={k} style={{ color: k === len - 1 ? '#eaffea' : rgba(a, 0.15 + (k / len) * 0.75), textShadow: k === len - 1 ? `0 0 10px ${a}` : 'none' }}>{ch}</span>
                        ))}
                    </div>
                </Faller>
            );
        })}
    </div>
);

const Petals = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 30 }, (_, i) => {
            const s = 14 + rand(i, 22) * 18;
            return (
                <Faller key={i} i={i} left={`${rand(i, 23) * 100}%`} dur={9 + rand(i, 24) * 10}>
                    <div style={{ animation: `petalSway ${3 + rand(i, 25) * 3}s ease-in-out ${-rand(i, 26) * 4}s infinite` }}>
                        <div style={{ width: s, height: s * 0.75, borderRadius: '80% 0 80% 0', background: `linear-gradient(135deg, ${rgba(i % 4 ? a : b, 0.95)}, ${rgba(i % 4 ? a : b, 0.5)})`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transform: 'translateY(-100%)' }} />
                    </div>
                </Faller>
            );
        })}
    </div>
);

const Waves = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 80% 50% at 30% 0%, ${rgba(a, 0.22)}, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 10%, ${rgba(b, 0.18)}, transparent 70%)` }} />
        {[[0.30, 30, 46, a], [0.22, 22, 34, b], [0.38, 14, 24, a]].map(([op, dur, h, c], i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${h}%`, overflow: 'hidden' }}>
                <svg viewBox="0 0 480 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, width: '200%', height: '100%', animation: `liquidWave ${dur}s linear infinite${i % 2 ? ' reverse' : ''}` }}>
                    <path d="M0,30 Q60,0 120,30 T240,30 T360,30 T480,30 V100 H0 Z" fill={rgba(c, op)} />
                </svg>
            </div>
        ))}
    </div>
);

const DOODLES = [
    'M10,40 L18,18 L26,40 L4,26 L32,26 Z',            // star
    'M2,20 Q10,2 18,20 T34,20 T50,20',                // squiggle
    'M20,4 A16,16 0 1 1 19.9,4',                      // circle
    'M4,30 L30,4 M22,4 L30,4 L30,12',                 // arrow
];
const Paper = ({ a, b, panel, text }) => (
    <div style={{ ...fill, overflow: 'hidden', background: panel }}>
        <div style={{ ...fill, backgroundImage: `radial-gradient(${rgba(isHex(text) ? text : '#000000', 0.16)} 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 120, width: 2, background: rgba(a, 0.45) }} />
        {Array.from({ length: 10 }, (_, i) => (
            <svg key={i} viewBox="0 0 52 44" style={{
                position: 'absolute', width: 70 + rand(i, 27) * 50, left: `${8 + rand(i, 28) * 86}%`, top: `${4 + rand(i, 29) * 86}%`,
                transform: `rotate(${rand(i, 30) * 60 - 30}deg)`, opacity: 0.55, overflow: 'visible',
            }}>
                <path d={DOODLES[i % DOODLES.length]} fill="none" stroke={i % 2 ? a : b} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ))}
        <div style={{ ...fill, background: 'radial-gradient(ellipse at center, transparent 60%, rgba(80,60,30,0.18) 100%)' }} />
    </div>
);

const Halftone = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{
            ...fill, backgroundImage: `radial-gradient(${rgba(a, 0.55)} 3px, transparent 3.5px)`, backgroundSize: '24px 24px',
            WebkitMaskImage: 'linear-gradient(135deg, #000 0%, transparent 55%)', maskImage: 'linear-gradient(135deg, #000 0%, transparent 55%)',
            animation: 'halftonePan 6s linear infinite',
        }} />
        <div style={{ position: 'absolute', right: '-8%', bottom: '-30%', width: '55%', height: '90%', background: b, transform: 'rotate(-14deg)', opacity: 0.9 }} />
        <div style={{ position: 'absolute', right: '-4%', bottom: '-34%', width: '55%', height: '90%', border: `6px solid ${a}`, transform: 'rotate(-14deg)' }} />
    </div>
);

const Sunburst = ({ a }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 3000, height: 3000, marginLeft: -1500, marginTop: -1500,
            background: `repeating-conic-gradient(${rgba(a, 0.09)} 0deg 6deg, transparent 6deg 15deg)`,
            animation: 'spinSlow 120s linear infinite',
        }} />
        <div style={{ ...fill, background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 85%)' }} />
        {/* Art-deco double rule */}
        <div style={{ position: 'absolute', inset: 36, border: `2px solid ${rgba(a, 0.75)}` }} />
        <div style={{ position: 'absolute', inset: 48, border: `1px solid ${rgba(a, 0.45)}` }} />
        {[{ top: 26, left: '50%' }, { bottom: 26, left: '50%' }].map((p, i) => (
            <div key={i} style={{ position: 'absolute', ...p, width: 22, height: 22, marginLeft: -11, background: a, transform: 'rotate(45deg)' }} />
        ))}
    </div>
);


// Rising sparks over a fire glow (Norse / forge looks). Same column trick as
// Faller, run in reverse so sparks climb.
const Embers = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 90% 45% at 50% 105%, ${rgba(a, 0.55)}, ${rgba(a, 0.12)} 55%, transparent 75%)` }} />
        <div style={{ ...fill, background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)' }} />
        {Array.from({ length: 46 }, (_, i) => {
            const s = 3 + rand(i, 31) * 5;
            const c = i % 5 === 0 ? b : a;
            return (
                <div key={i} style={{ position: 'absolute', left: `${rand(i, 32) * 100}%`, top: 0, height: '100%', animation: `fallDown ${5 + rand(i, 33) * 6}s linear ${-rand(i, 34) * 11}s infinite reverse` }}>
                    <div style={{ animation: `petalSway ${2 + rand(i, 35) * 2}s ease-in-out infinite` }}>
                        <div style={{ width: s, height: s, borderRadius: '50%', background: '#fff3d6', boxShadow: `0 0 ${s * 2}px ${c}, 0 0 ${s * 4}px ${rgba(c, 0.6)}`, opacity: 0.4 + rand(i, 36) * 0.6 }} />
                    </div>
                </div>
            );
        })}
    </div>
);

// Layered city silhouette with lit windows under a hazy neon sky.
const Skyline = ({ a, b, panel }) => {
    const layer = (n, salt, minH, maxH, color, windows) => {
        let x = 0;
        const out = [];
        for (let i = 0; x < 1920; i++) {
            const w = 70 + rand(i, salt) * 120, h = minH + rand(i, salt + 1) * (maxH - minH);
            out.push(<rect key={`b${i}`} x={x} y={1080 - h} width={w - 6} height={h} fill={color} />);
            if (windows) {
                for (let wy = 1080 - h + 20; wy < 1060; wy += 26) {
                    for (let wx = x + 10; wx < x + w - 20; wx += 20) {
                        const k = i * 997 + wx * 7 + wy;
                        if (rand(k, salt + 2) < 0.28) {
                            out.push(<rect key={`w${k}`} x={wx} y={wy} width={8} height={12} fill={rand(k, salt + 3) < 0.8 ? a : b} opacity={0.35 + rand(k, salt + 4) * 0.5} />);
                        }
                    }
                }
            }
            x += w;
        }
        return out;
    };
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            <div style={{ ...fill, background: `linear-gradient(180deg, transparent 20%, ${rgba(b, 0.22)} 70%, ${rgba(a, 0.25)})` }} />
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {layer(0, 40, 260, 560, rgba(b, 0.16), false)}
                {layer(1, 50, 140, 420, panel, true)}
            </svg>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: a, boxShadow: `0 0 30px 6px ${rgba(a, 0.6)}` }} />
        </div>
    );
};

// `glow` null = no box-shadow halo (needed when the moon is masked, where a
// shadow would show as a square tile).
const Moon = ({ size, color, glow }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, #fffdf2, ${color} 70%)`, boxShadow: glow ? `0 0 ${size * 0.4}px ${glow}, 0 0 ${size}px ${rgba(color, 0.25)}` : 'none' }} />
);

const NightSky = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <Starfield a={a} b={b} />
        <div style={{ position: 'absolute', right: '9%', top: '9%' }}>
            {/* crescent: the full moon with an offset disc masked out of it;
                the halo sits behind it since the mask would clip a box-shadow */}
            <div style={{ position: 'absolute', inset: -120, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(a, 0.22)}, transparent 65%)` }} />
            <div style={{ position: 'relative', WebkitMaskImage: 'radial-gradient(circle at 74% 30%, transparent 44%, #000 45.5%)', maskImage: 'radial-gradient(circle at 74% 30%, transparent 44%, #000 45.5%)' }}>
                <Moon size={190} color={a} glow={null} />
            </div>
        </div>
        {[0, 1, 2].map(i => (
            <div key={i} style={{
                position: 'absolute', left: `${-20 + i * 35}%`, top: `${58 + i * 9}%`, width: '60%', height: '22%',
                background: `radial-gradient(ellipse at center, ${rgba(b, 0.16)}, transparent 70%)`,
                animation: `blobDrift ${40 + i * 12}s ease-in-out ${-i * 9}s infinite`,
            }} />
        ))}
    </div>
);

const BAT = 'M0 6 C4 2 8 2 10 5 C11 2 13 1 14 3 C15 1 17 2 18 5 C20 2 24 2 28 6 C24 5 22 7 21 10 C19 8 17 8 14 11 C11 8 9 8 7 10 C6 7 4 5 0 6 Z';
const Spooky = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: '10%', marginLeft: -170 }}>
            <Moon size={340} color="#f6e7b0" glow={rgba(a, 0.55)} />
        </div>
        {/* bats crossing the moon */}
        {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', top: `${8 + rand(i, 60) * 45}%`, left: 0, width: '100%', animation: `batFly ${14 + rand(i, 61) * 12}s linear ${-rand(i, 62) * 26}s infinite` }}>
                <svg viewBox="0 0 28 12" style={{ width: 40 + rand(i, 63) * 40, animation: `batFlap ${0.25 + rand(i, 64) * 0.2}s ease-in-out infinite alternate`, transformOrigin: 'center' }}>
                    <path d={BAT} fill="#0a0410" />
                </svg>
            </div>
        ))}
        {/* low drifting fog */}
        {[0, 1, 2, 3].map(i => (
            <div key={`f${i}`} style={{
                position: 'absolute', left: `${-30 + i * 30}%`, bottom: `${-12 + (i % 2) * 6}%`, width: '70%', height: '40%',
                background: `radial-gradient(ellipse at center, ${rgba(i % 2 ? b : '#d8d0ff', 0.22)}, transparent 70%)`,
                animation: `blobDrift ${22 + i * 7}s ease-in-out ${-i * 5}s infinite`,
            }} />
        ))}
        <div style={{ ...fill, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
    </div>
);

const PAW = 'M12 22c-4 0-8-3-8-6 0-3 4-5 8-5s8 2 8 5c0 3-4 6-8 6zM4 10a2.6 3.2 0 1 0 0.01 0zM9 5a2.6 3.2 0 1 0 0.01 0zM15 5a2.6 3.2 0 1 0 0.01 0zM20 10a2.6 3.2 0 1 0 0.01 0z';
const Paws = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 36 }, (_, i) => {
            const col = i % 6, row = Math.floor(i / 6);
            return (
                <svg key={i} viewBox="0 0 24 24" style={{
                    position: 'absolute', width: 54, left: `${col * 17 + (row % 2) * 8 + 2}%`, top: `${row * 17 + 3}%`,
                    transform: `rotate(${rand(i, 70) * 50 - 25}deg)`, opacity: 0.16,
                }}>
                    <path d={PAW} fill={i % 3 ? a : b} />
                </svg>
            );
        })}
        {Array.from({ length: 14 }, (_, i) => (
            <div key={`h${i}`} style={{ position: 'absolute', left: `${rand(i, 71) * 100}%`, top: 0, height: '100%', animation: `fallDown ${9 + rand(i, 72) * 8}s linear ${-rand(i, 73) * 17}s infinite reverse` }}>
                <span style={{ display: 'block', fontSize: 22 + rand(i, 74) * 18, color: i % 2 ? a : b, opacity: 0.55, filter: `drop-shadow(0 0 6px ${rgba(a, 0.6)})` }}>♥</span>
            </div>
        ))}
    </div>
);

// Seigaiha (青海波) scale pattern under a rising sun.
const Seigaiha = ({ a, b, panel }) => {
    const id = `sg-${String(a).replace(/\W/g, '')}`;
    const arcs = (cx, cy) => [40, 31, 22, 13].map(r => <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} fill={panel} stroke={rgba(a, 0.45)} strokeWidth="2.2" />);
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '50%', top: '12%', width: 420, height: 420, marginLeft: -210, borderRadius: '50%', background: a, boxShadow: `0 0 120px ${rgba(a, 0.45)}` }} />
            <svg style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '46%' }}>
                <defs>
                    <pattern id={id} width="80" height="40" patternUnits="userSpaceOnUse">
                        {arcs(40, 0)}{arcs(0, 20)}{arcs(80, 20)}{arcs(40, 40)}
                    </pattern>
                    <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={panel} stopOpacity="1" />
                        <stop offset="0.35" stopColor={panel} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${id})`} />
                <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
            </svg>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '54%', height: 3, background: b, opacity: 0.6 }} />
        </div>
    );
};

// Wisps of steam rising and fading (café looks).
const Steam = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${rgba(a, 0.28)}, transparent 70%)` }} />
        {Array.from({ length: 9 }, (_, i) => (
            <svg key={i} viewBox="0 0 60 300" style={{
                position: 'absolute', bottom: '-8%', left: `${6 + i * 11 + rand(i, 80) * 4}%`, width: 70 + rand(i, 81) * 50, height: '75%',
                animation: `steamRise ${7 + rand(i, 82) * 5}s ease-in-out ${-rand(i, 83) * 12}s infinite`, overflow: 'visible',
            }}>
                <path d="M30 300 C10 250 50 210 30 160 C10 110 50 70 30 0" fill="none" stroke={rgba(i % 3 ? '#ffffff' : b, 0.22)} strokeWidth="14" strokeLinecap="round" style={{ filter: 'blur(4px)' }} />
            </svg>
        ))}
        <div style={{ ...fill, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
    </div>
);

const BACKDROP_MAP = {
    hudgrid: HudGrid, synthgrid: SynthGrid, scanlines: Scanlines, blobs: Blobs, starfield: Starfield,
    bokeh: Bokeh, rain: Rain, code: CodeRain, petals: Petals, waves: Waves, paper: Paper,
    halftone: Halftone, sunburst: Sunburst, embers: Embers, skyline: Skyline, nightsky: NightSky,
    spooky: Spooky, paws: Paws, seigaiha: Seigaiha, steam: Steam,
};

// `holes` + `box` cut the backdrop away over cameras (see holeMask below).
export const Backdrop = ({ variant, T, opacity = 1, holes, box }) => {
    const Comp = BACKDROP_MAP[variant] ?? Bokeh;
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', opacity, pointerEvents: 'none', ...holeMask(holes, box) }}>
            <Comp a={T.accent} b={T.accent2 ?? T.accent} panel={T.panelColor} text={T.textColor} />
        </div>
    );
};

// ── Headline effects (text element `fx`) ───────────────────────────────────

export const TEXT_FX = [
    { id: 'plain',   label: 'Plain' },
    { id: 'neon',    label: 'Neon' },
    { id: 'glitch',  label: 'Glitch' },
    { id: 'chrome',  label: 'Chrome' },
    { id: 'outline', label: 'Outline' },
    { id: 'retro',   label: 'Retro 3D' },
    { id: 'pixel',   label: 'Pixel' },
    { id: 'block',   label: 'Block' },
    { id: 'slant',   label: 'Slant plate' },
    { id: 'tape',    label: 'Tape' },
    { id: 'marker',  label: 'Marker' },
];

// Renders `children` (the headline) with the effect. `base` is the plain text
// style the renderer would otherwise use.
export const FxText = ({ fx, base, T, children }) => {
    const a = T.accent, b = T.accent2 ?? T.accent;
    const fs = base.fontSize ?? 48;
    const inline = { ...base, display: 'inline-block', maxWidth: '100%', width: 'auto', textShadow: 'none' };
    switch (fx) {
        case 'neon':
            return <span style={{ ...inline, color: '#fff', textShadow: `0 0 4px #fff, 0 0 12px ${a}, 0 0 26px ${a}, 0 0 52px ${a}`, animation: 'neonFlicker 7s linear infinite' }}>{children}</span>;
        case 'glitch':
            return (
                <span style={{ ...inline, position: 'relative' }}>
                    <span aria-hidden style={{ position: 'absolute', inset: 0, color: a, mixBlendMode: 'screen', animation: 'glitchA 2.6s steps(1) infinite' }}>{children}</span>
                    <span aria-hidden style={{ position: 'absolute', inset: 0, color: b, mixBlendMode: 'screen', animation: 'glitchB 3.1s steps(1) infinite' }}>{children}</span>
                    <span style={{ position: 'relative', textShadow: `0 0 18px ${rgba(a, 0.35)}` }}>{children}</span>
                </span>
            );
        case 'chrome':
            return (
                <span style={{
                    ...inline, color: 'transparent',
                    backgroundImage: `linear-gradient(180deg, #ffffff 0%, #e6ebff 38%, #6d7398 50%, #ffffff 53%, ${a} 80%, ${b} 100%)`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    filter: `drop-shadow(0 3px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 18px ${rgba(b, 0.45)})`,
                }}>{children}</span>
            );
        case 'outline':
            return <span style={{ ...inline, color: 'transparent', WebkitTextStroke: `${Math.max(1.5, fs / 26)}px ${base.color}`, filter: `drop-shadow(0 0 14px ${rgba(a, 0.7)})` }}>{children}</span>;
        case 'retro': {
            const d = Math.max(2, fs / 20);
            return <span style={{ ...inline, fontStyle: 'italic', textShadow: `${d}px ${d}px 0 ${b}, ${d * 2}px ${d * 2}px 0 ${a}, ${d * 3}px ${d * 3}px 0 rgba(0,0,0,0.45)` }}>{children}</span>;
        }
        case 'pixel': {
            const d = Math.max(2, Math.round(fs / 14));
            return <span style={{ ...inline, textShadow: `${d}px ${d}px 0 ${a}, ${d * 2}px ${d * 2}px 0 ${b}` }}>{children}</span>;
        }
        case 'block':
            return <span style={{ ...inline, background: a, color: '#0a0a0a', padding: '0.08em 0.35em', boxShadow: `${fs / 7}px ${fs / 7}px 0 ${b}`, border: '3px solid #0a0a0a' }}>{children}</span>;
        case 'slant':
            return (
                <span style={{
                    ...inline, padding: '0.12em 0.9em 0.12em 1.1em',
                    background: `linear-gradient(90deg, ${a} 0 0.35em, ${rgba(T.panelColor, 0.88)} 0.35em)`,
                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 0.6em) 100%, 0.6em 100%)',
                }}>{children}</span>
            );
        case 'tape':
            return (
                <span style={{
                    ...inline, color: '#2a2620', padding: '0.1em 0.6em', background: rgba(a, 0.85), transform: 'rotate(-2deg)',
                    clipPath: 'polygon(2% 0, 98% 4%, 100% 50%, 98% 96%, 2% 100%, 0 50%)',
                }}>{children}</span>
            );
        case 'marker':
            return (
                <span style={{
                    ...inline, padding: '0 0.25em',
                    backgroundImage: `linear-gradient(transparent 58%, ${rgba(a, 0.75)} 58%, ${rgba(a, 0.75)} 90%, transparent 90%)`,
                }}>{children}</span>
            );
        default:
            return null;   // caller renders the plain text
    }
};

// ── Lower-third plates (lowerthird `variant`) ──────────────────────────────

export const LOWER_THIRDS = [
    { id: 'panel',  label: 'Panel' },
    { id: 'slant',  label: 'Slant' },
    { id: 'glass',  label: 'Glass' },
    { id: 'bar',    label: 'Accent bar' },
    { id: 'neon',   label: 'Neon' },
    { id: 'brutal', label: 'Brutal' },
    { id: 'tape',   label: 'Tape' },
    { id: 'window', label: 'Window' },
    { id: 'pixel',  label: 'Pixel' },
];

// Returns the plate for a non-default variant, or null to use the classic panel.
export const LowerThirdPlate = ({ variant, T, name, sub, nameStyle, subStyle, radius }) => {
    const a = T.accent, b = T.accent2 ?? T.accent;
    const Name = (extra) => <div style={{ ...nameStyle, textShadow: 'none', ...extra }}>{name}</div>;
    const Sub = (extra) => <div style={{ ...subStyle, ...extra }}>{sub}</div>;
    const col = { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, minWidth: 0 };
    switch (variant) {
        case 'slant':
            return (
                <div style={{ width: '100%', height: '100%', display: 'flex', clipPath: 'polygon(0 0, 100% 0, calc(100% - 28px) 100%, 0 100%)' }}>
                    <div style={{ width: 14, background: a, flexShrink: 0 }} />
                    <div style={{ width: 6, background: b, flexShrink: 0, opacity: 0.85 }} />
                    <div style={{ ...col, flex: 1, padding: '6px 40px 6px 16px', background: `linear-gradient(90deg, ${rgba(T.panelColor, 0.94)}, ${rgba(T.panelColor, 0.78)})` }}>
                        {Name()}
                        {Sub({ color: a, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700 })}
                    </div>
                </div>
            );
        case 'glass':
            return (
                <div style={{
                    ...col, width: '100%', height: '100%', boxSizing: 'border-box', padding: '6px 18px 6px 22px', position: 'relative',
                    borderRadius: radius, background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', width: 6, height: 6, marginTop: -3, borderRadius: '50%', background: a, boxShadow: `0 0 10px ${a}` }} />
                    {Name()}
                    {Sub({ opacity: 0.85 })}
                </div>
            );
        case 'bar':
            return (
                <div style={{ width: '100%', height: '100%', display: 'flex', gap: 14, alignItems: 'stretch', padding: '4px 0' , boxSizing: 'border-box' }}>
                    <div style={{ width: 6, borderRadius: 3, background: `linear-gradient(180deg, ${a}, ${b})`, flexShrink: 0 }} />
                    <div style={col}>
                        {Name({ textShadow: '0 2px 10px rgba(0,0,0,0.7)' })}
                        {Sub({ color: a, textTransform: 'uppercase', letterSpacing: 2.5, textShadow: '0 1px 6px rgba(0,0,0,0.7)' })}
                    </div>
                </div>
            );
        case 'neon':
            return (
                <div style={{
                    ...col, width: '100%', height: '100%', boxSizing: 'border-box', padding: '6px 18px', borderRadius: radius,
                    background: rgba(T.panelColor, 0.7), border: `2px solid ${a}`,
                    boxShadow: `0 0 14px ${rgba(a, 0.6)}, inset 0 0 14px ${rgba(a, 0.3)}`,
                }}>
                    {Name({ color: '#fff', textShadow: `0 0 8px ${a}, 0 0 18px ${a}` })}
                    {Sub({ color: b, textShadow: `0 0 8px ${rgba(b, 0.7)}` })}
                </div>
            );
        case 'brutal':
            return (
                <div style={{ width: '100%', height: '100%', padding: '0 12px 12px 0', boxSizing: 'border-box' }}>
                    <div style={{ ...col, width: '100%', height: '100%', boxSizing: 'border-box', padding: '4px 16px', background: a, border: '3px solid #0a0a0a', boxShadow: `10px 10px 0 ${b}` }}>
                        {Name({ color: '#0a0a0a', textTransform: 'uppercase' })}
                        {Sub({ color: '#0a0a0a', fontWeight: 700, opacity: 0.8 })}
                    </div>
                </div>
            );
        case 'tape':
            return (
                <div style={{ width: '100%', height: '100%', padding: '10px 14px', boxSizing: 'border-box' }}>
                    <div style={{ ...col, position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', padding: '4px 18px', background: '#fffaf0', transform: 'rotate(-1.5deg)', boxShadow: '0 6px 16px rgba(0,0,0,0.3)' }}>
                        <span style={{ position: 'absolute', left: -14, top: -8, width: 70, height: 20, background: rgba(a, 0.6), transform: 'rotate(-28deg)' }} />
                        <span style={{ position: 'absolute', right: -14, bottom: -6, width: 70, height: 20, background: rgba(b, 0.55), transform: 'rotate(-24deg)' }} />
                        {Name({ color: '#2a2620' })}
                        {Sub({ color: '#5a5048' })}
                    </div>
                </div>
            );
        case 'window':
            return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: radius, overflow: 'hidden', border: `2px solid ${rgba(a, 0.9)}`, boxShadow: `0 10px 30px rgba(0,0,0,0.4), 0 0 20px ${rgba(b, 0.25)}`, boxSizing: 'border-box' }}>
                    <div style={{ height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', background: `linear-gradient(90deg, ${a}, ${b})` }}>
                        {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.25)' }} />)}
                        <span style={{ marginLeft: 6, fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#0b0b1a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(sub || 'live').toLowerCase().replace(/\s+/g, '_')}.exe</span>
                    </div>
                    <div style={{ ...col, flex: 1, padding: '0 14px', background: rgba(T.panelColor, 0.9) }}>{Name()}</div>
                </div>
            );
        case 'pixel':
            return (
                <div style={{ width: '100%', height: '100%', padding: '6px 16px 16px 6px', boxSizing: 'border-box' }}>
                    <div style={{ ...col, width: '100%', height: '100%', boxSizing: 'border-box', padding: '4px 14px', background: rgba(T.panelColor, 0.92), boxShadow: `0 -5px 0 0 ${a}, 0 5px 0 0 ${a}, -5px 0 0 0 ${a}, 5px 0 0 0 ${a}, 10px 10px 0 0 rgba(0,0,0,0.4)` }}>
                        {Name()}
                        {Sub({ color: a })}
                    </div>
                </div>
            );
        default:
            return null;
    }
};

// ── Graphic cam frames (frame element `frameStyle`) ────────────────────────

export const FRAME_STYLES = [
    { id: 'solid',    label: 'Solid' },
    { id: 'glow',     label: 'Glow' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'hud',      label: 'HUD' },
    { id: 'neon',     label: 'Neon' },
    { id: 'tape',     label: 'Polaroid' },
    { id: 'brutal',   label: 'Brutal' },
    { id: 'window',   label: 'Window' },
    { id: 'pixel',    label: 'Pixel' },
    { id: 'ornate',   label: 'Ornate' },
    { id: 'rec',      label: 'Camcorder' },
    { id: 'none',     label: 'None' },
];
const GRAPHIC_FRAMES = new Set(['hud', 'neon', 'tape', 'brutal', 'window', 'pixel', 'ornate', 'rec']);
export const isGraphicFrame = (fs) => GRAPHIC_FRAMES.has(fs);

// Ticking camcorder timecode, counted from mount.
const Timecode = ({ style }) => {
    const [s, setS] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setS(v => v + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const p = (n) => String(n).padStart(2, '0');
    return <span style={style}>{`${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`}</span>;
};

export const GraphicFrame = ({ style, color, T, w = 3, radius = 0, label }) => {
    const a = color ?? T.accent, b = T.accent2 ?? a;
    const box = { position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', pointerEvents: 'none' };
    const corner = (pos, c, len, bw, inset = 0) => {
        const [v, h] = pos;
        return <div key={pos} style={{ position: 'absolute', width: len, height: len, [v === 't' ? 'top' : 'bottom']: inset, [h === 'l' ? 'left' : 'right']: inset, [`border${v === 't' ? 'Top' : 'Bottom'}`]: `${bw}px solid ${c}`, [`border${h === 'l' ? 'Left' : 'Right'}`]: `${bw}px solid ${c}` }} />;
    };
    const CORNERS = [['t', 'l'], ['t', 'r'], ['b', 'l'], ['b', 'r']];
    switch (style) {
        case 'hud':
            return (
                <div style={{ ...box, border: `1px solid ${rgba(a, 0.35)}` }}>
                    {CORNERS.map(p => corner(p, a, '18%', Math.max(3, w + 1)))}
                    <div style={{ position: 'absolute', left: 0, top: 0, padding: '3px 10px', background: a, color: '#001018', fontFamily: "'Orbitron', ui-monospace, monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>{label || 'CAM_01'}</div>
                    <div style={{ position: 'absolute', right: 10, bottom: 8, display: 'flex', gap: 3 }}>
                        {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 4, height: 6 + i * 3, alignSelf: 'flex-end', background: i < 3 ? a : rgba(a, 0.3) }} />)}
                    </div>
                    <div style={{ position: 'absolute', right: '22%', top: -1, width: '30%', height: 3, background: `repeating-linear-gradient(90deg, ${a} 0 6px, transparent 6px 10px)` }} />
                </div>
            );
        case 'neon':
            return (
                <div style={{ ...box, padding: 10 }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: radius, border: `${Math.max(2, w)}px solid ${a}`, boxShadow: `0 0 10px ${a}, 0 0 22px ${rgba(a, 0.5)}, inset 0 0 12px ${rgba(a, 0.5)}`, animation: 'neonFlicker 9s linear infinite' }}>
                        <div style={{ position: 'absolute', inset: 6, borderRadius: Math.max(0, radius - 6), border: `1px solid ${rgba(b, 0.8)}`, boxShadow: `0 0 8px ${rgba(b, 0.6)}` }} />
                    </div>
                </div>
            );
        case 'tape':
            return (
                <div style={{ ...box, border: '10px solid #fbf8f1', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
                    <span style={{ position: 'absolute', left: -22, top: 6, width: 96, height: 26, background: rgba(a, 0.7), transform: 'rotate(-35deg)' }} />
                    <span style={{ position: 'absolute', right: -22, top: 6, width: 96, height: 26, background: rgba(b, 0.65), transform: 'rotate(35deg)' }} />
                </div>
            );
        case 'brutal':
            return (
                <div style={{ ...box, padding: '0 14px 14px 0' }}>
                    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', border: `${Math.max(4, w + 2)}px solid ${a}`, boxShadow: `14px 14px 0 ${b}` }} />
                </div>
            );
        case 'window':
            return (
                <div style={{ ...box, borderRadius: radius, border: `2px solid ${a}`, overflow: 'hidden', boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 24px ${rgba(b, 0.3)}` }}>
                    <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', background: `linear-gradient(90deg, ${a}, ${b})` }}>
                        {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.25)' }} />)}
                        <span style={{ marginLeft: 6, fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#0b0b1a' }}>{label || 'webcam.exe'}</span>
                    </div>
                </div>
            );
        case 'pixel': {
            const s = Math.max(5, w + 2);
            return (
                <div style={{ ...box, padding: `${s}px ${s * 3}px ${s * 3}px ${s}px` }}>
                    <div style={{ width: '100%', height: '100%', boxShadow: `0 -${s}px 0 0 ${a}, 0 ${s}px 0 0 ${a}, -${s}px 0 0 0 ${a}, ${s}px 0 0 0 ${a}, ${s * 2}px ${s * 2}px 0 0 ${rgba(b, 0.8)}` }} />
                </div>
            );
        }
        case 'ornate':
            return (
                <div style={box}>
                    <div style={{ position: 'absolute', inset: 8, border: `${Math.max(2, w)}px solid ${a}` }} />
                    <div style={{ position: 'absolute', inset: 15, border: `1px solid ${rgba(a, 0.7)}` }} />
                    {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }, { top: 0, left: '50%', marginLeft: -9 }].map((p, i) => (
                        <div key={i} style={{ position: 'absolute', ...p, width: 18, height: 18, background: a, transform: 'rotate(45deg) scale(0.8)', boxShadow: '0 0 0 3px rgba(0,0,0,0.35)' }} />
                    ))}
                </div>
            );
        case 'rec': {
            const mono = { fontFamily: "'VT323', ui-monospace, monospace", fontSize: 24, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', letterSpacing: 1 };
            return (
                <div style={box}>
                    {CORNERS.map(p => corner(p, 'rgba(255,255,255,0.9)', '12%', 3, 12))}
                    <span style={{ ...mono, position: 'absolute', left: 26, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#ff2b2b', boxShadow: '0 0 8px #ff2b2b', animation: 'recBlink 1s steps(1) infinite' }} />
                        {label || 'REC'}
                    </span>
                    <Timecode style={{ ...mono, position: 'absolute', right: 26, top: 18 }} />
                    <span style={{ ...mono, position: 'absolute', left: 26, bottom: 16, fontSize: 20, opacity: 0.85 }}>SP ▶</span>
                </div>
            );
        }
        default:
            return null;
    }
};

// ── Camera cut-outs ────────────────────────────────────────────────────────
// OBS cameras sit *under* the overlay, so an opaque scene background or a
// backdrop would hide them. holeMask() returns mask styles that punch
// transparent holes (rounded rect / ellipse / hexagon / diamond) where cameras
// or game-capture frames are, in the coordinate space of `frame` (the masked
// layer's own box, in canvas %). Holes: [{ box, shape, radius }].

const CANVAS_W = 1920, CANVAS_H = 1080;

const holePath = ({ box, shape = 'rect', radius = 0 }, frame, fw, fh) => {
    const x = ((box.x - frame.x) / frame.w) * fw;
    const y = ((box.y - frame.y) / frame.h) * fh;
    const w = (box.w / frame.w) * fw;
    const h = (box.h / frame.h) * fh;
    const f = (n) => n.toFixed(1);
    if (shape === 'ellipse') {
        const rx = w / 2, ry = h / 2;
        return `M${f(x)} ${f(y + ry)}a${f(rx)} ${f(ry)} 0 1 0 ${f(w)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-w)} 0Z`;
    }
    if (shape === 'hexagon') {
        return `M${f(x + w * 0.25)} ${f(y)}H${f(x + w * 0.75)}L${f(x + w)} ${f(y + h / 2)}L${f(x + w * 0.75)} ${f(y + h)}H${f(x + w * 0.25)}L${f(x)} ${f(y + h / 2)}Z`;
    }
    if (shape === 'diamond') {
        return `M${f(x + w / 2)} ${f(y)}L${f(x + w)} ${f(y + h / 2)}L${f(x + w / 2)} ${f(y + h)}L${f(x)} ${f(y + h / 2)}Z`;
    }
    // Scale px radius from the 1920-wide canvas into this layer's units.
    const r = Math.max(0, Math.min(radius * (fw / ((frame.w / 100) * CANVAS_W)), w / 2, h / 2));
    if (!r) return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
    return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
};

export const holeMask = (holes, frame = { x: 0, y: 0, w: 100, h: 100 }) => {
    if (!holes?.length || !frame?.w || !frame?.h) return {};
    const fw = (frame.w / 100) * CANVAS_W, fh = (frame.h / 100) * CANVAS_H;
    const d = `M0 0H${fw}V${fh}H0Z` + holes.map(hl => holePath(hl, frame, fw, fh)).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${fw} ${fh}' preserveAspectRatio='none'><path fill-rule='evenodd' d='${d}'/></svg>`;
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    return {
        WebkitMaskImage: url, maskImage: url,
        WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    };
};

// Cut-outs for a scene: visible cameras (shaped by their cam frame) plus any
// cam-frame element marked `hole` (e.g. a game-capture window).
const CAM_SLOTS = ['faceCam', 'handCam', 'roomCam'];
const CAM_SHAPE = { circle: 'ellipse', hexagon: 'hexagon', diamond: 'diamond' };
export const sceneHoles = ({ boxes = {}, boxVisibility = {}, camStyles = {}, elements = [] }, theme) => [
    ...CAM_SLOTS.filter(id => boxVisibility[id] && boxes[id]).map(id => {
        const cs = camStyles[id] ?? {};
        return { box: boxes[id], shape: CAM_SHAPE[cs.frame] ?? 'rect', radius: cs.frame && cs.frame !== 'none' ? (cs.radius ?? 14) : (theme?.cornerRadius ?? 0) };
    }),
    ...elements.filter(e => e.type === 'frame' && e.hole && !e.hidden && e.box)
        .map(e => ({ box: e.box, shape: 'rect', radius: typeof e.borderRadius === 'number' ? e.borderRadius : (theme?.cornerRadius ?? 0) })),
];
