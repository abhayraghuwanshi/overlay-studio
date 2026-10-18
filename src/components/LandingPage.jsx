import { useEffect, useState } from 'react';
import { scoresUrl, usageUrl } from '../config';
import { track } from '../analytics';

const REPO = 'abhayraghuwanshi/cool-stream-overlay';
const REPO_URL = `https://github.com/${REPO}`;
const REQUEST_URL = `${REPO_URL}/issues/new/choose`;

// Star count from the public GitHub API — unauthenticated is 60 req/hr per IP,
// so cache it for an hour. Storage can throw (private mode), so it's best-effort.
const STARS_KEY = 'gh_stars';
const fetchStars = async () => {
    try {
        const c = JSON.parse(localStorage.getItem(STARS_KEY) || 'null');
        if (c && Date.now() - c.t < 3600e3) return c.n;
    } catch { /* ignore */ }
    const r = await fetch(`https://api.github.com/repos/${REPO}`);
    if (!r.ok) return null;
    const n = (await r.json()).stargazers_count;
    try { localStorage.setItem(STARS_KEY, JSON.stringify({ n, t: Date.now() })); } catch { /* ignore */ }
    return n;
};

// Flag value → image: a feed crest URL passes through; a 2-letter code → flagcdn.
const flagSrc = (v) => {
    const s = String(v || '').trim();
    if (/^https?:\/\//i.test(s)) return s;
    const c = s.toLowerCase();
    return /^[a-z]{2}(-[a-z]{2,3})?$/.test(c) ? `https://flagcdn.com/w40/${c}.png` : null;
};

// in-play → upcoming (soonest) → finished (most recent), same as the editor picker.
const matchRank = (m) => (m.status === 'LIVE' || m.status === 'HT') ? 0 : m.status === 'SCHED' ? 1 : 2;
const sortMatches = (a, b) => {
    const pa = matchRank(a), pb = matchRank(b);
    if (pa !== pb) return pa - pb;
    const ta = +new Date(a.utcDate), tb = +new Date(b.utcDate);
    return pa === 2 ? tb - ta : ta - tb;
};
const matchWhen = (m) => {
    if (m.status === 'LIVE') return `${m.minute ?? 0}'`;
    if (m.status === 'HT') return 'HT';
    if (m.status === 'FT') return 'FT';
    try { return new Date(m.utcDate).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return 'Soon'; }
};

const FEATURES = [
    { title: 'Drag-and-drop editor', desc: 'Place cameras, text and widgets on a live 16:9 canvas. No code, nothing to install.' },
    { title: 'OBS browser source', desc: 'One link drops the overlay straight into OBS — and your edits sync to it as you make them.' },
    { title: 'Live match scoreboard', desc: 'Search a fixture, pick it, and the score keeps itself up to date on stream.' },
    { title: 'Pets & mood ring', desc: 'Little mascots that roam the canvas and shift with the mood of the room.' },
    { title: 'Goals, timers & widgets', desc: 'Follower and sub goals, countdowns, a pomodoro, tickers, sticky notes, a spin wheel.' },
    { title: 'Themes & recording', desc: 'Re-skin the whole overlay in a click, and record the stream right in the browser.' },
];

// The live-scores strip is tournament-branded (FIFA World Cup) — flip this
// back on when the next tournament the scores feed covers is underway.
const SHOW_LIVE_SCORES = false;

// Warm near-monochrome palette — type does the work, colour is used sparingly.
const C = {
    bg: '#0b0b0d',
    ink: '#f1efe9',
    dim: 'rgba(241,239,233,0.56)',
    faint: 'rgba(241,239,233,0.34)',
    line: 'rgba(241,239,233,0.12)',
    accent: '#ff6a3d',
    live: '#ff5b5b',
    win: '#e7c14b',
};
const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

const kicker = { fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.faint };

const MatchRow = ({ m }) => {
    const live = m.status === 'LIVE' || m.status === 'HT';
    const fa = flagSrc(m.home.flag), fb = flagSrc(m.away.flag);
    const Flag = ({ src }) => src ? <img src={src} alt="" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} onError={e => e.currentTarget.style.display = 'none'} /> : null;
    const nm = { fontFamily: DISPLAY, fontSize: 14, fontWeight: 500, color: C.ink };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, padding: '13px 2px', borderTop: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Flag src={fa} /><span style={nm}>{m.home.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
                    {m.score.home}<span style={{ color: C.faint, margin: '0 5px' }}>:</span>{m.score.away}
                </span>
                <span style={{ fontFamily: BODY, fontSize: 10, letterSpacing: 0.5, color: live ? C.live : C.faint, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.live, boxShadow: `0 0 6px ${C.live}`, animation: 'pulse 1.4s ease-in-out infinite' }} />}
                    {matchWhen(m)}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
                <span style={nm}>{m.away.name}</span><Flag src={fb} />
            </div>
        </div>
    );
};

export default function LandingPage() {
    const [matches, setMatches] = useState(null);
    const [stats, setStats] = useState(null);
    const [stars, setStars] = useState(null);

    useEffect(() => {
        document.title = 'Overlay Studio — free stream overlay editor for OBS';
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'auto';
        let alive = true;
        if (SHOW_LIVE_SCORES) {
            fetch(scoresUrl()).then(r => r.ok ? r.json() : null).then(d => { if (alive) setMatches(d?.matches || []); }).catch(() => { if (alive) setMatches([]); });
        }
        fetch(`${usageUrl()}?summary=1&days=14`).then(r => r.ok ? r.json() : null).then(d => { if (alive && d) setStats(d); }).catch(() => {});
        fetchStars().then(n => { if (alive && n != null) setStars(n); }).catch(() => {});
        return () => { alive = false; document.body.style.overflow = prev; };
    }, []);

    const topMatches = (matches || []).slice().sort(sortMatches).slice(0, 6);
    const num = (n) => n == null ? '—' : Intl.NumberFormat().format(n);

    const wrap = { maxWidth: 940, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' };
    const btn = { fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: C.bg, background: C.ink, padding: '12px 22px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' };
    const STATS = [
        { v: num(stats?.rooms), l: 'overlays created' },
        { v: num(stats?.today?.uniques), l: 'visitors today' },
        { v: num(stats?.totalLoads), l: 'loads · 14 days' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: BODY, WebkitFontSmoothing: 'antialiased' }}>
            {/* top bar */}
            <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, letterSpacing: -0.2 }}>Overlay Studio</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Star Overlay Studio on GitHub"
                        onClick={() => track('github_star_click', { location: 'header' })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: DISPLAY, fontSize: 13, fontWeight: 500, color: C.dim, textDecoration: 'none', border: `1px solid ${C.line}`, borderRadius: 6, padding: '5px 10px' }}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                        <span>★ Star</span>
                        {stars != null && <span style={{ color: C.ink, fontVariantNumeric: 'tabular-nums', borderLeft: `1px solid ${C.line}`, paddingLeft: 7 }}>{num(stars)}</span>}
                    </a>
                    <a href="/?studio" style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 500, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.accent}`, paddingBottom: 2 }}>Open the studio →</a>
                </div>
            </div>

            {/* hero — left aligned, type led */}
            <div style={{ ...wrap, paddingTop: 'clamp(56px, 11vw, 120px)', paddingBottom: 'clamp(48px, 8vw, 88px)' }}>
                <div style={kicker}>Browser-native stream overlays</div>
                <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(38px, 7vw, 76px)', lineHeight: 1.02, letterSpacing: -1.5, margin: '20px 0 0', maxWidth: 760 }}>
                    Design your overlay,<br />then drop one link<br />into OBS<span style={{ color: C.accent }}>.</span>
                </h1>
                <p style={{ fontFamily: BODY, fontSize: 'clamp(15px, 2vw, 18px)', color: C.dim, maxWidth: 540, lineHeight: 1.6, margin: '26px 0 0' }}>
                    Cameras, live scores, goals, pets, timers and themes — arranged on a real canvas and recorded in the browser. Nothing to install.
                </p>
                <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', marginTop: 34 }}>
                    <a href="/?studio" style={btn}>Open the studio →</a>
                    <a href="#features" style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.dim, textDecoration: 'none' }}>See what's inside ↓</a>
                </div>
            </div>

            {/* stats — big numerals. A top rule per cell + a bottom rule on the
                band: on desktop the rules line up into one band; when cells wrap on
                mobile each top rule becomes a clean divider. No vertical borders to
                orphan, so nothing breaks at any width. */}
            <div style={{ ...wrap, paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${C.line}` }}>
                    {STATS.map((s) => (
                        <div key={s.l} style={{ flex: '1 1 150px', borderTop: `1px solid ${C.line}`, padding: '22px 0 20px' }}>
                            <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{s.v}</div>
                            <div style={{ fontFamily: BODY, fontSize: 12, color: C.faint, letterSpacing: 0.5, marginTop: 8 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* live world cup — hidden via SHOW_LIVE_SCORES, see above */}
            {SHOW_LIVE_SCORES && topMatches.length > 0 && (
                <div style={{ ...wrap, paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={kicker}>Live · FIFA World Cup</div>
                        <div style={{ fontFamily: BODY, fontSize: 12, color: C.faint }}>powers the in-overlay scoreboard</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 40px' }}>
                        {topMatches.map(m => <MatchRow key={m.id} m={m} />)}
                    </div>
                </div>
            )}

            {/* features — numbered list, no icons */}
            <div id="features" style={{ ...wrap, paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
                <div style={{ ...kicker, marginBottom: 18 }}>What's inside</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 48px' }}>
                    {FEATURES.map((f, i) => (
                        <div key={f.title} style={{ display: 'flex', gap: 16, padding: '22px 0', borderTop: `1px solid ${C.line}` }}>
                            <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: C.accent, paddingTop: 3, fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>{f.title}</div>
                                <div style={{ fontFamily: BODY, fontSize: 14, color: C.dim, lineHeight: 1.55, marginTop: 6 }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ fontFamily: BODY, fontSize: 14, color: C.dim, margin: '22px 0 0' }}>
                    Missing something?{' '}
                    <a href={`${REPO_URL}/issues/new?template=component_request.yml`} target="_blank" rel="noreferrer"
                        onClick={() => track('request_click', { location: 'features', template: 'component' })}
                        style={{ color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.accent}`, paddingBottom: 1 }}>
                        Request a component ↗
                    </a>
                </p>
            </div>

            {/* close */}
            <div style={{ ...wrap, paddingTop: 'clamp(40px, 7vw, 72px)', paddingBottom: 'clamp(56px, 9vw, 96px)', borderTop: `1px solid ${C.line}` }}>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(26px, 4.5vw, 40px)', letterSpacing: -1, lineHeight: 1.1, margin: 0, maxWidth: 520 }}>
                    Build the overlay your stream actually deserves.
                </h2>
                <div style={{ marginTop: 26 }}>
                    <a href="/?studio" style={btn}>Open the studio →</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginTop: 44 }}>
                    <span style={{ fontFamily: BODY, fontSize: 12, color: C.faint }}>Overlay Studio — free, browser-based, runs as an OBS browser source.</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <a href="/?studio" style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 500, color: C.dim, textDecoration: 'none' }}>Studio</a>
                        <a href={REQUEST_URL} target="_blank" rel="noreferrer"
                            onClick={() => track('request_click', { location: 'footer' })}
                            style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 500, color: C.dim, textDecoration: 'none' }}>
                            Request a feature ↗
                        </a>
                        <a href={REPO_URL} target="_blank" rel="noreferrer"
                            onClick={() => track('github_star_click', { location: 'footer' })}
                            style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 500, color: C.dim, textDecoration: 'none', borderBottom: `1px solid ${C.line}`, paddingBottom: 2 }}>
                            ★ Star on GitHub ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
