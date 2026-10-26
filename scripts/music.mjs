// Procedural background music for the promo videos — an original lo-fi /
// synthwave loop rendered sample-by-sample, so the soundtrack is ours outright
// (no licence, no copyright claims on upload). Also lays alert chimes and
// scene-change whooshes at given times so the audio follows the video.
//
//   renderTrack({ seconds, alerts: [t…], whooshes: [t…] }) → WAV Buffer (44.1 kHz stereo, 16-bit)

const SR = 44100;
const BPM = 96;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// A minor: Am – F – C – G (i – VI – III – VII), one chord per bar.
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const CHORDS = [
    [57, 60, 64],   // Am
    [53, 57, 60],   // F
    [48, 52, 55],   // C
    [55, 59, 62],   // G
];
const ROOTS = [33, 29, 36, 31];   // bass roots (octave 1–2)

// Deterministic noise so every render is identical.
let seed = 1;
const noise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
};

const TAU = Math.PI * 2;
// Band-limited saw from a few harmonics (soft, pad-friendly).
const saw = (ph, harmonics = 6) => {
    let v = 0;
    for (let k = 1; k <= harmonics; k++) v += Math.sin(ph * k) / k;
    return v * 0.55;
};
const tri = (ph) => (2 / Math.PI) * Math.asin(Math.sin(ph));

export const renderTrack = ({ seconds, alerts = [], whooshes = [] }) => {
    const n = Math.ceil(seconds * SR);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const add = (i, l, r = l) => { if (i >= 0 && i < n) { L[i] += l; R[i] += r; } };

    // ── Pad: detuned saws per chord, slow swell, low-passed ──
    let lpL = 0, lpR = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const bar = Math.floor(t / BAR);
        const inBar = t - bar * BAR;
        const chord = CHORDS[bar % CHORDS.length];
        const env = Math.min(1, inBar / 0.6) * (1 - 0.25 * (inBar / BAR));
        let l = 0, r = 0;
        for (const note of chord) {
            const f = midi(note);
            l += saw(TAU * f * 0.998 * t);
            r += saw(TAU * f * 1.002 * t);
        }
        const cutoff = 0.035 + 0.02 * Math.sin(TAU * t / (BAR * 4));   // slow filter movement
        lpL += cutoff * (l - lpL);
        lpR += cutoff * (r - lpR);
        add(i, lpL * env * 0.16, lpR * env * 0.16);
    }

    const beats = Math.floor(seconds / BEAT);
    // Drums and bass sit out the first bar so the track swells in.
    for (let b = 0; b < beats; b++) {
        const t0 = b * BEAT;
        const bar = Math.floor(t0 / BAR);
        const beatInBar = b % 4;
        const start = Math.floor(t0 * SR);
        const drums = bar >= 1;

        // Kick on 1 and 3: pitch-dropping sine.
        if (drums && (beatInBar === 0 || beatInBar === 2)) {
            let ph = 0;
            for (let j = 0; j < 0.38 * SR; j++) {
                const tt = j / SR;
                ph += TAU * (45 + 110 * Math.exp(-tt * 28)) / SR;
                add(start + j, Math.sin(ph) * Math.exp(-tt * 9) * 0.55);
            }
        }
        // Snare on 2 and 4: noise burst + body tone, slightly wide.
        if (drums && (beatInBar === 1 || beatInBar === 3)) {
            let hp = 0;
            for (let j = 0; j < 0.22 * SR; j++) {
                const tt = j / SR;
                const x = noise();
                hp += 0.5 * (x - hp);
                const v = ((x - hp) * 0.5 + Math.sin(TAU * 185 * tt) * 0.3) * Math.exp(-tt * 18) * 0.32;
                add(start + j, v * 0.95, v);
            }
        }
        // Hats on every 8th: short high-passed noise, panned right.
        if (drums) {
            for (const off of [0, BEAT / 2]) {
                const s = Math.floor((t0 + off) * SR);
                let prev = 0;
                for (let j = 0; j < 0.05 * SR; j++) {
                    const x = noise();
                    const v = (x - prev) * Math.exp(-(j / SR) * 70) * (off ? 0.06 : 0.045);
                    prev = x;
                    add(s + j, v * 0.7, v);
                }
            }
        }
        // Bass: root on 1 and 3 plus a pickup on the "and" of 2.
        if (drums) {
            const f = midi(ROOTS[bar % ROOTS.length] + 12);
            const hits = beatInBar === 0 || beatInBar === 2 ? [[0, 0.42]] : beatInBar === 1 ? [[BEAT / 2, 0.2]] : [];
            for (const [off, len] of hits) {
                const s = Math.floor((t0 + off) * SR);
                for (let j = 0; j < len * SR; j++) {
                    const tt = j / SR;
                    const v = (Math.sin(TAU * f * tt) + 0.25 * saw(TAU * f * tt, 3)) * Math.min(1, tt * 200) * Math.exp(-tt * 3.2) * 0.3;
                    add(s + j, v);
                }
            }
        }
    }

    // ── Arpeggio: chord tones in 8ths, octave up, with a ping-pong echo ──
    const arpL = new Float32Array(n), arpR = new Float32Array(n);
    const steps = Math.floor(seconds / (BEAT / 2));
    for (let k = 0; k < steps; k++) {
        const t0 = k * BEAT / 2;
        const bar = Math.floor(t0 / BAR);
        if (bar < 1) continue;
        const chord = CHORDS[bar % CHORDS.length];
        const note = chord[[0, 1, 2, 1, 2, 0, 1, 2][k % 8]] + 12;
        const f = midi(note);
        const s = Math.floor(t0 * SR);
        for (let j = 0; j < 0.3 * SR; j++) {
            const tt = j / SR;
            const v = tri(TAU * f * tt) * Math.exp(-tt * 10) * 0.075;
            if (s + j < n) { arpL[s + j] += v; arpR[s + j] += v; }
        }
    }
    const dly = Math.floor(BEAT * 0.75 * SR);
    for (let i = 0; i < n; i++) {
        const eL = i >= dly ? arpR[i - dly] * 0.45 : 0;
        const eR = i >= dly ? arpL[i - dly] * 0.45 : 0;
        arpL[i] += eL; arpR[i] += eR;
        add(i, arpL[i], arpR[i]);
    }

    // ── Alert chimes: bright two-note bell, matches the in-page chime ──
    for (const at of alerts) {
        const s = Math.floor(at * SR);
        [[1046.5, 0], [1568, 0.11]].forEach(([f, d]) => {
            const ss = s + Math.floor(d * SR);
            for (let j = 0; j < 0.9 * SR; j++) {
                const tt = j / SR;
                const v = (Math.sin(TAU * f * tt) + 0.3 * Math.sin(TAU * f * 2.01 * tt)) * Math.min(1, tt * 300) * Math.exp(-tt * 5) * 0.22;
                add(ss + j, v);
            }
        });
    }

    // ── Whooshes on scene changes: swept, filtered noise ──
    for (const at of whooshes) {
        const len = 0.5;
        const s = Math.floor((at - len * 0.6) * SR);
        let lp = 0;
        for (let j = 0; j < len * SR; j++) {
            const p = j / (len * SR);
            lp += (0.02 + 0.25 * p) * (noise() - lp);
            const v = lp * Math.sin(Math.PI * p) * 0.35;
            add(s + j, v * (1 - p * 0.6), v * (0.4 + p * 0.6));
        }
    }

    // ── Master: fades, soft clip, normalise ──
    const fadeIn = 1.0 * SR, fadeOut = 2.5 * SR;
    let peak = 0;
    for (let i = 0; i < n; i++) {
        const g = Math.min(1, i / fadeIn, (n - i) / fadeOut);
        L[i] = Math.tanh(L[i] * g * 1.2);
        R[i] = Math.tanh(R[i] * g * 1.2);
        peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const norm = peak > 0 ? 0.89 / peak : 1;

    const buf = Buffer.alloc(44 + n * 4);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
    buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) {
        buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
        buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
    }
    return buf;
};
