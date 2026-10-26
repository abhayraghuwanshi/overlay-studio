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
    { id: 'diyas',     label: 'Diyas & toran' },
    { id: 'fireworks', label: 'Fireworks' },
    { id: 'snowfall',  label: 'Snow & lights' },
    { id: 'pumpkins',  label: 'Jack-o\'-lanterns' },
    { id: 'holi',      label: 'Holi colours' },
    { id: 'lanterns',  label: 'Red lanterns' },
    { id: 'crescent',  label: 'Crescent & fanous' },
    { id: 'hearts',    label: 'Floating hearts' },
    { id: 'leaves',    label: 'Autumn leaves' },
    { id: 'balloons',  label: 'Balloons & confetti' },
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
        {/* off-centre so headline text never sits on the bright disc */}
        <div style={{ position: 'absolute', left: '76%', top: '7%' }}>
            <Moon size={300} color="#f6e7b0" glow={rgba(a, 0.55)} />
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

// ── Festive backdrops ──────────────────────────────────────────────────────

// Points along a sagging swag from x0→x1, for garlands, fairy lights, bunting.
const swag = (x0, x1, y, sag, n) => Array.from({ length: n + 1 }, (_, k) => {
    const t = k / n;
    return [x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)];
});
const vignette = (a = 0.6) => <div style={{ ...fill, background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${a}) 100%)` }} />;

// Elements that float up from below the canvas and leave off the top.
const Riser = ({ i, salt, dur, left, children }) => (
    <div style={{ position: 'absolute', left, top: 0, height: '100%', animation: `riseUp ${dur}s linear ${-rand(i, salt) * dur}s infinite` }}>
        {children}
    </div>
);

const CONFETTI = ['#ff5fa2', '#4cc9f0', '#ffd23f', '#7bf1a8', '#b388ff'];
const Confetti = ({ a, b, n = 40, salt = 90 }) => Array.from({ length: n }, (_, i) => {
    const c = [a, b, ...CONFETTI][i % 7];
    const w = 8 + rand(i, salt) * 8;
    return (
        <Faller key={`c${i}`} i={i + salt} left={`${rand(i, salt + 1) * 100}%`} dur={6 + rand(i, salt + 2) * 6}>
            <div style={{ animation: `petalSway ${3 + rand(i, salt + 3) * 3}s ease-in-out infinite` }}>
                <div style={{ animation: `confettiSpin ${1.2 + rand(i, salt + 4) * 1.6}s linear infinite` }}>
                    <div style={{ width: w, height: i % 3 === 0 ? w : w * 0.45, borderRadius: i % 3 === 0 ? '50%' : 2, background: c, transform: 'translateY(-100%)' }} />
                </div>
            </div>
        </Faller>
    );
});

// Clay diyas with flickering flames under a marigold toran (Diwali).
const Diyas = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 100% 40% at 50% 100%, ${rgba(a, 0.32)}, transparent 70%)` }} />
        {Array.from({ length: 40 }, (_, i) => {
            const s = 2 + rand(i, 100) * 4;
            const c = i % 3 ? a : b;
            return (
                <span key={`s${i}`} style={{
                    position: 'absolute', left: `${rand(i, 101) * 100}%`, top: `${18 + rand(i, 102) * 60}%`, width: s, height: s, borderRadius: '50%',
                    background: '#fff3c4', boxShadow: `0 0 ${s * 3}px ${c}`, animation: `twinkle ${2 + rand(i, 103) * 3}s ease-in-out ${-rand(i, 104) * 5}s infinite`,
                }} />
            );
        })}
        {/* toran: marigold swags with hanging mango leaves */}
        <svg viewBox="0 0 1920 200" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '19%' }}>
            {[0, 1, 2, 3, 4, 5].map(s => (
                <g key={s}>
                    {swag(s * 320, s * 320 + 320, 8, 80, 16).map(([x, y], k) => (
                        <circle key={k} cx={x} cy={y} r={13} fill={k % 2 ? '#ff7a00' : a} stroke="rgba(120,40,0,0.35)" strokeWidth="2" />
                    ))}
                    <path d={`M${s * 320} 14 q-12 40 0 70 q12 -30 0 -70z`} fill="#2f8f3a" />
                    <circle cx={s * 320} cy={12} r={10} fill={b} />
                </g>
            ))}
        </svg>
        {/* diya row */}
        {Array.from({ length: 9 }, (_, i) => (
            <div key={`d${i}`} style={{ position: 'absolute', left: `${3 + i * 11.6}%`, bottom: `${-1 + (i % 2)}%`, width: 96, height: 96, transform: 'scale(0.8)', transformOrigin: '50% 100%' }}>
                <div style={{ position: 'absolute', left: -70, top: -90, width: 236, height: 236, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(a, 0.42)}, transparent 62%)` }} />
                <svg viewBox="0 0 24 40" style={{ position: 'absolute', left: 36, top: 0, width: 24, height: 44, transformOrigin: '50% 100%', animation: `flameFlicker ${0.8 + rand(i, 105) * 0.7}s ease-in-out ${-rand(i, 106)}s infinite alternate` }}>
                    <path d="M12 0 C20 14 22 26 12 38 C2 26 4 14 12 0Z" fill="#ff9d1a" />
                    <path d="M12 12 C16 20 17 28 12 36 C7 28 8 20 12 12Z" fill="#fff4b0" />
                </svg>
                <svg viewBox="0 0 96 48" style={{ position: 'absolute', left: 0, top: 40, width: 96, height: 48 }}>
                    <path d="M2 10 Q48 70 94 10 Q48 22 2 10Z" fill="#b5532a" />
                    <path d="M2 10 Q48 22 94 10 Q48 2 2 10Z" fill="#7a2e14" />
                    <path d="M14 22 Q48 46 82 22" fill="none" stroke={a} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
                </svg>
            </div>
        ))}
        {vignette(0.55)}
    </div>
);

// Fireworks bursting around the edges with falling glitter (New Year).
const BURSTS = [[14, 24], [84, 18], [30, 10], [70, 32], [8, 58], [92, 56], [52, 8], [22, 78], [80, 80]];
const Fireworks = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `linear-gradient(180deg, transparent 55%, ${rgba(b, 0.14)})` }} />
        {BURSTS.map(([x, y], i) => {
            const c = [a, b, '#ff6b9a', '#7cf7ff', '#ffffff'][i % 5];
            const r = 110 + rand(i, 110) * 90, dur = 2.4 + rand(i, 111) * 1.4, delay = -rand(i, 112) * dur;
            return (
                <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}>
                    <div style={{ position: 'absolute', left: -r * 0.6, top: -r * 0.6, width: r * 1.2, height: r * 1.2, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(c, 0.45)}, transparent 65%)`, animation: `fwFlash ${dur}s ease-out ${delay}s infinite` }} />
                    {Array.from({ length: 20 }, (_, k) => (
                        <div key={k} style={{ position: 'absolute', transform: `rotate(${k * 18}deg)` }}>
                            <div style={{ '--r': `${-r}px`, marginLeft: -2, width: 4, height: 16, borderRadius: 3, background: k % 2 ? c : '#fff', boxShadow: `0 0 8px ${c}`, animation: `fwBurst ${dur}s cubic-bezier(.15,.7,.3,1) ${delay}s infinite` }} />
                        </div>
                    ))}
                </div>
            );
        })}
        {Array.from({ length: 50 }, (_, i) => (
            <Faller key={`g${i}`} i={i + 120} left={`${rand(i, 121) * 100}%`} dur={7 + rand(i, 122) * 7}>
                <span style={{ display: 'block', width: 3, height: 3, borderRadius: '50%', background: i % 2 ? a : '#fff', boxShadow: `0 0 6px ${a}`, opacity: 0.7, animation: `twinkle ${1 + rand(i, 123) * 2}s ease-in-out infinite` }} />
            </Faller>
        ))}
        {vignette(0.5)}
    </div>
);

// Snowfall, fairy lights and snowy pines (Christmas).
const Snowfall = ({ a, b }) => {
    const bulbs = ['#ffd23f', a, '#4cc9f0', b];
    const pine = (x, y, s, k) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M0 -150 L45 -70 L22 -70 L60 0 L-60 0 L-22 -70 L-45 -70Z" fill="#0f3d2a" />
            <path d="M0 -150 L18 -118 L-18 -118Z M-22 -70 L0 -84 L22 -70 L14 -66 L0 -74 L-14 -66Z" fill="#f4fbff" opacity="0.9" />
            <rect x="-8" y="0" width="16" height="18" fill="#3b2414" />
        </g>
    );
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {[[110, 960, 1.4], [260, 990, 1], [1700, 970, 1.5], [1830, 1000, 1.05], [1560, 1010, 0.8]].map(([x, y, s], k) => pine(x, y, s, k))}
                <path d="M0 990 Q300 930 640 985 T1280 980 T1920 960 V1080 H0Z" fill="#e8f4ff" opacity="0.92" />
                <path d="M0 1040 Q480 990 960 1035 T1920 1020 V1080 H0Z" fill="#ffffff" />
            </svg>
            <svg viewBox="0 0 1920 220" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '20%', overflow: 'visible' }}>
                {[0, 1, 2, 3].map(s => {
                    const pts = swag(s * 480, s * 480 + 480, 6, 110, 12);
                    return (
                        <g key={s}>
                            <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#1d2b22" strokeWidth="3" />
                            {pts.slice(1, -1).map(([x, y], k) => {
                                const c = bulbs[(k + s) % 4];
                                return (
                                    <g key={k} style={{ animation: `bulbBlink ${1.6 + rand(k + s * 20, 130) * 1.6}s ease-in-out ${-rand(k + s * 20, 131) * 3}s infinite` }}>
                                        <circle cx={x} cy={y + 16} r={20} fill={c} opacity="0.25" />
                                        <ellipse cx={x} cy={y + 14} rx={8} ry={12} fill={c} />
                                        <rect x={x - 5} y={y - 2} width={10} height={7} rx={2} fill="#555" />
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
            {Array.from({ length: 80 }, (_, i) => {
                const s = 3 + rand(i, 132) * (i % 8 === 0 ? 10 : 5);
                return (
                    <Faller key={`f${i}`} i={i + 133} left={`${rand(i, 134) * 100}%`} dur={8 + rand(i, 135) * 10}>
                        <div style={{ animation: `petalSway ${3 + rand(i, 136) * 4}s ease-in-out infinite` }}>
                            <div style={{ width: s, height: s, borderRadius: '50%', background: '#ffffff', opacity: 0.55 + rand(i, 137) * 0.45, filter: s > 8 ? 'blur(1.5px)' : 'none', transform: 'translateY(-100%)' }} />
                        </div>
                    </Faller>
                );
            })}
            {vignette(0.45)}
        </div>
    );
};

// Glowing jack-o'-lanterns, cobwebs and drifting ghosts (Halloween).
const Web = ({ flip }) => {
    const rays = [0, 15, 30, 45, 60, 75, 90].map(d => d * Math.PI / 180);
    return (
        <svg viewBox="0 0 300 300" style={{ position: 'absolute', top: 0, [flip ? 'right' : 'left']: 0, width: 300, height: 300, transform: flip ? 'scaleX(-1)' : 'none' }}>
            {rays.map((t, k) => <line key={k} x1="0" y1="0" x2={Math.cos(t) * 300} y2={Math.sin(t) * 300} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />)}
            {[50, 95, 145, 200, 255].map(r => (
                <path key={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"
                    d={rays.map((t, k) => `${k ? 'Q' + (Math.cos(t - 0.13) * r * 0.9) + ' ' + (Math.sin(t - 0.13) * r * 0.9) + ' ' : 'M'}${Math.cos(t) * r} ${Math.sin(t) * r}`).join(' ')} />
            ))}
        </svg>
    );
};
const Pumpkin = ({ size, i }) => (
    <svg viewBox="0 0 120 100" style={{ width: size, height: size * 0.83, overflow: 'visible' }}>
        <path d="M56 18 C54 8 58 2 66 0 L68 6 C63 8 62 12 63 18Z" fill="#3f6b1f" />
        <ellipse cx="34" cy="58" rx="30" ry="38" fill="#d9600b" />
        <ellipse cx="86" cy="58" rx="30" ry="38" fill="#d9600b" />
        <ellipse cx="60" cy="58" rx="32" ry="41" fill="#f07a14" />
        <g style={{ animation: `glowFlicker ${1.4 + rand(i, 140)}s ease-in-out ${-rand(i, 141) * 2}s infinite` }}>
            <path d="M36 46 L48 30 L56 48Z M84 46 L72 30 L64 48Z M54 58 L60 50 L66 58Z" fill="#ffe27a" />
            <path d="M28 66 Q60 96 92 66 L84 70 L78 64 L70 72 L60 66 L50 72 L42 64 L36 70Z" fill="#ffe27a" />
        </g>
    </svg>
);
const GHOST = 'M0 30 C0 10 12 0 25 0 C38 0 50 10 50 30 L50 62 L42 55 L34 62 L25 55 L16 62 L8 55 L0 62Z';
const Pumpkins = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 100% 35% at 50% 100%, ${rgba(a, 0.35)}, transparent 70%)` }} />
        <Web /><Web flip />
        {/* a spider on a thread */}
        <div style={{ position: 'absolute', left: '19%', top: 0, animation: 'ghostBob 5s ease-in-out infinite' }}>
            <div style={{ width: 1.5, height: 150, margin: '0 auto', background: 'rgba(255,255,255,0.35)' }} />
            <svg viewBox="0 0 40 30" style={{ width: 40, marginLeft: -19 }}>
                <g stroke="#0a0505" strokeWidth="2" fill="none">{[-1, 1].map(s => [6, 12, 18].map(y => <path key={`${s}${y}`} d={`M20 ${y} q${s * 10} -6 ${s * 18} ${y / 3}`} />))}</g>
                <ellipse cx="20" cy="14" rx="8" ry="10" fill="#0a0505" />
            </svg>
        </div>
        {Array.from({ length: 4 }, (_, i) => (
            <div key={`g${i}`} style={{ position: 'absolute', top: `${14 + i * 16}%`, left: 0, width: '100%', animation: `batFly ${30 + rand(i, 142) * 20}s linear ${-rand(i, 143) * 50}s infinite` }}>
                <svg viewBox="0 0 50 62" style={{ width: 50 + rand(i, 144) * 30, opacity: 0.32, animation: `ghostBob ${3 + rand(i, 145) * 2}s ease-in-out infinite`, filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' }}>
                    <path d={GHOST} fill="#f4f1ff" />
                    <ellipse cx="17" cy="26" rx="4" ry="6" fill="#1a1020" /><ellipse cx="33" cy="26" rx="4" ry="6" fill="#1a1020" />
                </svg>
            </div>
        ))}
        {Array.from({ length: 24 }, (_, i) => (
            <span key={`w${i}`} style={{
                position: 'absolute', left: `${rand(i, 146) * 100}%`, top: `${45 + rand(i, 147) * 45}%`, width: 5, height: 5, borderRadius: '50%',
                background: b, boxShadow: `0 0 12px ${b}`, animation: `twinkle ${2 + rand(i, 148) * 3}s ease-in-out ${-rand(i, 149) * 4}s infinite`,
            }} />
        ))}
        {[[2, 150], [10, 110], [17, 80], [80, 90], [87, 150], [95, 100]].map(([x, s], i) => (
            <div key={`p${i}`} style={{ position: 'absolute', left: `${x}%`, bottom: '1%', transform: 'translateX(-50%)', filter: `drop-shadow(0 0 24px ${rgba(a, 0.7)})` }}>
                <Pumpkin size={s} i={i} />
            </div>
        ))}
        {vignette(0.6)}
    </div>
);

// Clouds of coloured powder and flying specks (Holi).
const HOLI = ['#ff3d9a', '#ffd400', '#22c55e', '#3b82f6', '#ff7a00', '#a855f7'];
const splat = (i, r = 100) => {
    const pts = Array.from({ length: 16 }, (_, k) => {
        const t = (k / 16) * Math.PI * 2, rr = r * (0.6 + rand(i * 16 + k, 150) * 0.55);
        return [Math.cos(t) * rr, Math.sin(t) * rr];
    });
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const m0 = mid(pts[15], pts[0]);
    return `M${m0} ` + pts.map((p, k) => `Q${p} ${mid(p, pts[(k + 1) % 16])}`).join(' ') + 'Z';
};
const Holi = ({ a, b }) => {
    const cols = [a, b, ...HOLI];
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            {Array.from({ length: 10 }, (_, i) => {
                const left = i % 2 ? 60 + rand(i, 151) * 45 : -15 + rand(i, 151) * 40;
                return (
                    <div key={`c${i}`} style={{
                        position: 'absolute', left: `${left}%`, top: `${rand(i, 152) * 90 - 10}%`, width: '45%', height: '55%',
                        background: `radial-gradient(ellipse at center, ${rgba(cols[i % cols.length], 0.42)}, transparent 68%)`,
                        animation: `blobDrift ${18 + rand(i, 153) * 14}s ease-in-out ${-rand(i, 154) * 20}s infinite`,
                    }} />
                );
            })}
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {[[90, 120, 1.6], [1820, 140, 1.3], [140, 950, 1.4], [1780, 960, 1.8], [420, 60, 0.7], [1500, 1040, 0.8]].map(([x, y, s], i) => (
                    <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.85">
                        <path d={splat(i)} fill={cols[(i + 2) % cols.length]} />
                        {[0, 1, 2, 3].map(k => <circle key={k} cx={Math.cos(k * 1.7 + i) * 135} cy={Math.sin(k * 1.7 + i) * 135} r={6 + rand(k + i * 4, 155) * 10} fill={cols[(i + 2) % cols.length]} />)}
                    </g>
                ))}
            </svg>
            {Array.from({ length: 50 }, (_, i) => (
                <Riser key={`s${i}`} i={i} salt={156} dur={8 + rand(i, 157) * 8} left={`${rand(i, 158) * 100}%`}>
                    <div style={{ animation: `drift ${3 + rand(i, 159) * 3}s ease-in-out infinite` }}>
                        <span style={{ display: 'block', width: 6 + rand(i, 160) * 8, height: 6 + rand(i, 160) * 8, borderRadius: '50%', background: cols[i % cols.length], opacity: 0.8, filter: 'blur(1px)' }} />
                    </div>
                </Riser>
            ))}
        </div>
    );
};

// Swaying red lanterns with gold tassels and drifting blossoms (Lunar New Year).
const Lanterns = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <div style={{ ...fill, background: `radial-gradient(ellipse 100% 40% at 50% 100%, ${rgba(b, 0.2)}, transparent 70%)` }} />
        {[[4, 70, 1], [14, 20, 0.75], [25, 60, 0.85], [74, 40, 0.85], [85, 10, 0.75], [95, 60, 1], [40, 0, 0.55], [60, 10, 0.55]].map(([x, len, s], i) => (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: 0, transformOrigin: '50% 0', animation: `lanternSwing ${3.5 + rand(i, 160) * 2}s ease-in-out ${-rand(i, 161) * 4}s infinite` }}>
                <div style={{ width: 2, height: len, marginLeft: -1, background: rgba(b, 0.7) }} />
                <div style={{ position: 'relative', marginLeft: -60 * s, width: 120 * s }}>
                    <div style={{ position: 'absolute', left: '-40%', top: '-10%', width: '180%', height: 180 * s, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(a, 0.4)}, transparent 62%)` }} />
                    <svg viewBox="0 0 120 170" style={{ position: 'relative', width: '100%' }}>
                        <rect x="38" y="0" width="44" height="12" rx="3" fill={b} />
                        <ellipse cx="60" cy="66" rx="56" ry="54" fill={a} />
                        <ellipse cx="60" cy="66" rx="56" ry="54" fill="url(#lnShade)" />
                        {[16, 34, 50].map(rx => <ellipse key={rx} cx="60" cy="66" rx={rx} ry="54" fill="none" stroke="rgba(90,0,0,0.45)" strokeWidth="2" />)}
                        <rect x="38" y="116" width="44" height="12" rx="3" fill={b} />
                        {[-12, -6, 0, 6, 12].map(dx => <line key={dx} x1={60 + dx} y1="128" x2={60 + dx * 1.3} y2="168" stroke={b} strokeWidth="2.5" />)}
                        <defs>
                            <radialGradient id="lnShade" cx="0.4" cy="0.4" r="0.7">
                                <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
                                <stop offset="1" stopColor="#5a0000" stopOpacity="0.5" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        ))}
        {Array.from({ length: 26 }, (_, i) => {
            const s = 10 + rand(i, 162) * 10;
            return (
                <Faller key={`p${i}`} i={i + 163} left={`${rand(i, 164) * 100}%`} dur={10 + rand(i, 165) * 10}>
                    <div style={{ animation: `petalSway ${3 + rand(i, 166) * 3}s ease-in-out infinite` }}>
                        <div style={{ width: s, height: s * 0.75, borderRadius: '80% 0 80% 0', background: i % 3 ? '#ffb7c5' : b, opacity: 0.85, transform: 'translateY(-100%)' }} />
                    </div>
                </Faller>
            );
        })}
        {vignette(0.55)}
    </div>
);

// Crescent and star, glowing fanous lanterns and a domed skyline (Eid).
const Fanous = ({ a, size }) => (
    <svg viewBox="0 0 60 130" style={{ width: size, overflow: 'visible' }}>
        <circle cx="30" cy="76" r="44" fill={rgba(a, 0.22)} />
        <path d="M30 0 L30 10" stroke={a} strokeWidth="2" />
        <path d="M18 24 Q30 6 42 24Z" fill={a} />
        <path d="M14 26 H46 L52 46 H8Z" fill="#8a5a1c" />
        <path d="M8 46 H52 L46 100 H14Z" fill="#2a1a08" />
        {[0, 1, 2].map(k => <path key={k} d={`M${14 + k * 11.5} 50 h9 l-1 46 h-7z`} fill="#ffd27a" opacity="0.92" />)}
        <path d="M14 100 H46 L30 124Z" fill="#8a5a1c" />
    </svg>
);
const Crescent = ({ a, b, panel }) => {
    let x = 0;
    const city = [];
    for (let i = 0; x < 1920; i++) {
        const w = 120 + rand(i, 170) * 160, h = 120 + rand(i, 171) * 120;
        const base = 1080 - h;
        city.push(<rect key={`r${i}`} x={x} y={base} width={w} height={h} fill={panel} />);
        city.push(<path key={`w${i}`} d={`M${x + w / 2 - 12} ${base + 70} v-24 a12 12 0 0 1 24 0 v24Z`} fill={rgba(a, 0.55)} />);
        city.push(<path key={`d${i}`} d={`M${x + w * 0.15} ${base} A${w * 0.35} ${w * 0.38} 0 0 1 ${x + w * 0.85} ${base}Z`} fill={panel} />);
        city.push(<path key={`f${i}`} d={`M${x + w / 2} ${base - w * 0.38} v-26`} stroke={panel} strokeWidth="4" />);
        if (i % 2 === 0) {
            const mx = x + w + 6;
            city.push(<path key={`m${i}`} d={`M${mx} 1080 V${base - 140} l9 -40 l9 40 V1080Z`} fill={panel} />);
        }
        x += w + 30;
    }
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            <Starfield a={a} b={b} />
            <div style={{ position: 'absolute', right: '10%', top: '10%' }}>
                <div style={{ position: 'absolute', inset: -110, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(a, 0.25)}, transparent 65%)` }} />
                <div style={{ position: 'relative', WebkitMaskImage: 'radial-gradient(circle at 72% 32%, transparent 42%, #000 43.5%)', maskImage: 'radial-gradient(circle at 72% 32%, transparent 42%, #000 43.5%)' }}>
                    <Moon size={170} color={a} glow={null} />
                </div>
                <span style={{ position: 'absolute', left: 120, top: 38, fontSize: 42, color: a, textShadow: `0 0 14px ${a}` }}>★</span>
            </div>
            {[[6, 60, 70], [14, 160, 52], [22, 40, 44]].map(([x, len, size], i) => (
                <div key={i} style={{ position: 'absolute', left: `${x}%`, top: 0, transformOrigin: '50% 0', animation: `lanternSwing ${4 + i}s ease-in-out ${-i * 1.3}s infinite` }}>
                    <div style={{ width: 2, height: len, marginLeft: size / 2 - 1, background: rgba(a, 0.6) }} />
                    <div style={{ marginTop: -2, filter: `drop-shadow(0 0 16px ${rgba(a, 0.8)})` }}><Fanous a={a} size={size} /></div>
                </div>
            ))}
            <div style={{ ...fill, background: `linear-gradient(180deg, transparent 50%, ${rgba(b, 0.32)})` }} />
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `drop-shadow(0 -2px 0 ${rgba(a, 0.35)})` }}>{city}</svg>
        </div>
    );
};

// Hearts drifting upward through soft bokeh (Valentine's).
const HEART = 'M12 21 C5 15 1 11.5 1 7.5 C1 4 3.7 1.5 7 1.5 C9 1.5 11 2.6 12 4.3 C13 2.6 15 1.5 17 1.5 C20.3 1.5 23 4 23 7.5 C23 11.5 19 15 12 21Z';
const Hearts = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        <Bokeh a={a} b={b} />
        {Array.from({ length: 28 }, (_, i) => {
            const s = 18 + rand(i, 180) * 52;
            const outline = i % 4 === 0;
            return (
                <Riser key={i} i={i} salt={181} dur={11 + rand(i, 182) * 10} left={`${rand(i, 183) * 100}%`}>
                    <div style={{ animation: `drift ${4 + rand(i, 184) * 3}s ease-in-out infinite` }}>
                        <svg viewBox="0 0 24 24" style={{ width: s, opacity: 0.45 + rand(i, 185) * 0.45, filter: `drop-shadow(0 0 ${s / 5}px ${rgba(a, 0.7)})${s > 55 ? ' blur(2px)' : ''}`, transform: `rotate(${rand(i, 186) * 30 - 15}deg)` }}>
                            <path d={HEART} fill={outline ? 'none' : (i % 3 ? a : b)} stroke={outline ? '#ffffff' : 'none'} strokeWidth="1.4" />
                        </svg>
                    </div>
                </Riser>
            );
        })}
        {vignette(0.5)}
    </div>
);

// Tumbling maple leaves in a warm late-afternoon glow (autumn / Thanksgiving).
const MAPLE = 'M0 -48 L8 -28 L22 -34 L18 -14 L40 -18 L30 0 L44 8 L20 12 L24 30 L4 20 L2 44 L-2 44 L-4 20 L-24 30 L-20 12 L-44 8 L-30 0 L-40 -18 L-18 -14 L-22 -34 L-8 -28Z';
const Leaves = ({ a, b }) => {
    const cols = [a, b, '#c0392b', '#d35400', '#9c6b30'];
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            <div style={{ ...fill, background: `radial-gradient(ellipse 80% 60% at 80% 0%, ${rgba(b, 0.28)}, transparent 70%)` }} />
            <div style={{ ...fill, background: `radial-gradient(ellipse 100% 30% at 50% 100%, ${rgba(a, 0.3)}, transparent 70%)` }} />
            {Array.from({ length: 30 }, (_, i) => {
                const s = 26 + rand(i, 190) * 34;
                return (
                    <Faller key={i} i={i + 191} left={`${rand(i, 192) * 100}%`} dur={10 + rand(i, 193) * 9}>
                        <div style={{ animation: `petalSway ${3.5 + rand(i, 194) * 3}s ease-in-out infinite` }}>
                            <svg viewBox="-50 -50 100 100" style={{ width: s, transform: 'translateY(-100%)', animation: `leafSpin ${4 + rand(i, 195) * 5}s linear infinite${i % 2 ? ' reverse' : ''}`, opacity: 0.9 }}>
                                <path d={MAPLE} fill={cols[i % cols.length]} />
                                <path d="M0 44 V-30" stroke="rgba(60,20,0,0.45)" strokeWidth="2.5" />
                            </svg>
                        </div>
                    </Faller>
                );
            })}
            {vignette(0.5)}
        </div>
    );
};

// Rising balloons, bunting and confetti (birthdays).
const Balloons = ({ a, b }) => {
    const cols = [a, b, ...CONFETTI];
    return (
        <div style={{ ...fill, overflow: 'hidden' }}>
            {Array.from({ length: 14 }, (_, i) => {
                const s = 70 + rand(i, 200) * 50;
                const c = cols[i % cols.length];
                return (
                    <Riser key={`b${i}`} i={i} salt={201} dur={16 + rand(i, 202) * 10} left={`${(i / 14) * 100 + rand(i, 203) * 4}%`}>
                        <div style={{ animation: `drift ${5 + rand(i, 204) * 3}s ease-in-out infinite` }}>
                            <svg viewBox="0 0 60 150" style={{ width: s, overflow: 'visible' }}>
                                <ellipse cx="30" cy="34" rx="27" ry="33" fill={c} />
                                <ellipse cx="20" cy="22" rx="6" ry="10" fill="#fff" opacity="0.4" transform="rotate(-20 20 22)" />
                                <path d="M26 66 L34 66 L30 72Z" fill={c} />
                                <path d="M30 72 C24 92 36 108 28 148" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
                            </svg>
                        </div>
                    </Riser>
                );
            })}
            <Confetti a={a} b={b} n={44} salt={210} />
            <svg viewBox="0 0 1920 160" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '15%' }}>
                {[0, 1, 2, 3].map(s => {
                    const pts = swag(s * 480, s * 480 + 480, 4, 70, 10);
                    return (
                        <g key={s}>
                            <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
                            {pts.slice(0, -1).map(([x, y], k) => {
                                const [x2, y2] = pts[k + 1];
                                return <path key={k} d={`M${x} ${y} L${x2} ${y2} L${(x + x2) / 2} ${(y + y2) / 2 + 58}Z`} fill={cols[(k + s) % cols.length]} />;
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const BACKDROP_MAP = {
    hudgrid: HudGrid, synthgrid: SynthGrid, scanlines: Scanlines, blobs: Blobs, starfield: Starfield,
    bokeh: Bokeh, rain: Rain, code: CodeRain, petals: Petals, waves: Waves, paper: Paper,
    halftone: Halftone, sunburst: Sunburst, embers: Embers, skyline: Skyline, nightsky: NightSky,
    spooky: Spooky, paws: Paws, seigaiha: Seigaiha, steam: Steam,
    diyas: Diyas, fireworks: Fireworks, snowfall: Snowfall, pumpkins: Pumpkins, holi: Holi,
    lanterns: Lanterns, crescent: Crescent, hearts: Hearts, leaves: Leaves, balloons: Balloons,
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
