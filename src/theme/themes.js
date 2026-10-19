// Theme tokens — the shared visual vocabulary every scene/element resolves
// against. Elements may store either a literal value (e.g. "#ffffff", 8) or a
// token string ("@accent", "@radius"). At render time tokens resolve to the
// active theme's value, so swapping the theme re-skins everything authored
// with tokens. Literals always pass through unchanged (backward compatible).
//
// A "theme pack" (see src/scenes/packs.js) bundles one theme with a set of
// scenes built on it — the cohesive, one-click unit a streamer installs.

// frameStyle drives the cam-frame element: none | solid | glow | gradient, plus
// the graphic styles hud | neon | tape | brutal | window | pixel | ornate | rec.
//
// "Style kit" fields (optional) give a theme its graphic identity, not just its
// palette. Elements opt in with tokens, so switching theme swaps the graphics:
//   backdrop    — animated full-canvas backdrop (see BACKDROPS in graphics.jsx)
//   textFx      — headline treatment for text elements (see TEXT_FX)
//   lowerThird  — lower-third plate style (see LOWER_THIRDS)
//   displayFont — headline font; falls back to fontFamily

export const THEMES = [
    {
        id: 'midnight',
        name: 'Midnight',
        accent: '#6366f1',
        accent2: '#a855f7',
        textColor: '#ffffff',
        panelColor: '#0a0a0f',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 8,
        frameStyle: 'glow',
        backdrop: 'bokeh',
    },
    {
        id: 'neon',
        name: 'Neon',
        accent: '#22d3ee',
        accent2: '#f472b6',
        textColor: '#ecfeff',
        panelColor: '#05070d',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        cornerRadius: 3,
        frameStyle: 'solid',
        backdrop: 'synthgrid',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        accent: '#e5e7eb',
        accent2: '#9ca3af',
        textColor: '#ffffff',
        panelColor: '#111114',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 2,
        frameStyle: 'solid',
        backdrop: 'scanlines',
    },
    {
        id: 'warm',
        name: 'Warm',
        accent: '#f59e0b',
        accent2: '#ef4444',
        textColor: '#fff7ed',
        panelColor: '#1a0f05',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 14,
        frameStyle: 'gradient',
        backdrop: 'bokeh',
    },
    {
        id: 'aurora',
        name: 'Aurora',
        accent: '#2dd4bf',
        accent2: '#6366f1',
        textColor: '#f0fdfa',
        panelColor: '#07120f',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 12,
        frameStyle: 'glow',
        backdrop: 'waves',
    },
    {
        id: 'sunset',
        name: 'Sunset',
        accent: '#fb7185',
        accent2: '#fbbf24',
        textColor: '#fff1f2',
        panelColor: '#1a0a12',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 16,
        frameStyle: 'gradient',
        backdrop: 'bokeh',
    },
    {
        id: 'vapor',
        name: 'Vapor',
        accent: '#f0abfc',
        accent2: '#22d3ee',
        textColor: '#fdf4ff',
        panelColor: '#11071a',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        cornerRadius: 6,
        frameStyle: 'glow',
        backdrop: 'synthgrid',
    },
    {
        id: 'crimson',
        name: 'Crimson',
        accent: '#f43f5e',
        accent2: '#b91c1c',
        textColor: '#fef2f2',
        panelColor: '#140505',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        cornerRadius: 4,
        frameStyle: 'glow',
        backdrop: 'scanlines',
    },
    {
        id: 'ocean',
        name: 'Ocean',
        accent: '#38bdf8',
        accent2: '#2563eb',
        textColor: '#f0f9ff',
        panelColor: '#04101c',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 12,
        frameStyle: 'glow',
        backdrop: 'waves',
    },
    {
        id: 'gold',
        name: 'Gold',
        accent: '#d4af37',
        accent2: '#b8860b',
        textColor: '#fffbeb',
        panelColor: '#0c0a05',
        fontFamily: 'Georgia, "Times New Roman", serif',
        cornerRadius: 6,
        frameStyle: 'gradient',
        backdrop: 'sunburst',
    },
    {
        id: 'emerald',
        name: 'Emerald',
        accent: '#34d399',
        accent2: '#10b981',
        textColor: '#ecfdf5',
        panelColor: '#04140d',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 14,
        frameStyle: 'glow',
        backdrop: 'petals',
    },
    {
        id: 'royale',
        name: 'Royale',
        accent: '#a78bfa',
        accent2: '#f0c350',
        textColor: '#faf5ff',
        panelColor: '#100726',
        fontFamily: 'Georgia, "Times New Roman", serif',
        cornerRadius: 10,
        frameStyle: 'gradient',
        backdrop: 'sunburst',
    },
    {
        id: 'frost',
        name: 'Frost',
        accent: '#7dd3fc',
        accent2: '#e0f2fe',
        textColor: '#f0f9ff',
        panelColor: '#0a1420',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 18,
        frameStyle: 'glow',
        backdrop: 'starfield',
    },
    {
        id: 'matrix',
        name: 'Matrix',
        accent: '#22c55e',
        accent2: '#4ade80',
        textColor: '#dcfce7',
        panelColor: '#020a04',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        cornerRadius: 0,
        frameStyle: 'solid',
        backdrop: 'code',
    },
    {
        id: 'bubblegum',
        name: 'Bubblegum',
        accent: '#f472b6',
        accent2: '#c084fc',
        textColor: '#fdf2f8',
        panelColor: '#1a0a16',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 20,
        frameStyle: 'gradient',
        backdrop: 'bokeh',
    },
    {
        id: 'inferno',
        name: 'Inferno',
        accent: '#fb923c',
        accent2: '#ef4444',
        textColor: '#fff7ed',
        panelColor: '#1a0805',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        cornerRadius: 4,
        frameStyle: 'glow',
        backdrop: 'halftone',
    },
    {
        id: 'cosmic',
        name: 'Cosmic',
        accent: '#818cf8',
        accent2: '#e879f9',
        textColor: '#eef2ff',
        panelColor: '#0a0820',
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 14,
        frameStyle: 'glow',
        backdrop: 'starfield',
    },
    {
        id: 'worldcup',
        name: 'World Cup',
        accent: '#facc15',     // trophy gold
        accent2: '#16a34a',    // pitch green
        textColor: '#ffffff',
        panelColor: '#0a2616',  // deep pitch green
        fontFamily: 'inter, system-ui, sans-serif',
        cornerRadius: 8,
        frameStyle: 'gradient',
        backdrop: 'halftone',
    },
    // ── Style-kit themes ── each carries a full graphic identity (backdrop,
    // headline effect, lower-third plate, cam frame, display font) modelled on
    // the looks that lead the overlay marketplaces: tactical HUD, synthwave,
    // lo-fi, scrapbook, brutalist, pixel, Y2K, lava-lamp, nouveau, VHS…
    {
        id: 'cyberhud', name: 'Cyber HUD',
        accent: '#00e5ff', accent2: '#ff2a6d',
        textColor: '#e6fbff', panelColor: '#03121a',
        fontFamily: "'Rajdhani', 'Inter', system-ui, sans-serif",
        displayFont: "'Orbitron', 'Rajdhani', sans-serif",
        cornerRadius: 0, frameStyle: 'hud',
        backdrop: 'hudgrid', textFx: 'glitch', lowerThird: 'slant',
    },
    {
        id: 'synthwave', name: 'Synthwave',
        accent: '#ff2a9d', accent2: '#ffb300',
        textColor: '#fff0fb', panelColor: '#12002a',
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        displayFont: "'Monoton', 'Space Grotesk', sans-serif",
        cornerRadius: 4, frameStyle: 'neon',
        backdrop: 'synthgrid', textFx: 'retro', lowerThird: 'neon',
    },
    {
        id: 'lofi', name: 'Lo-fi Café',
        accent: '#e8b48a', accent2: '#8fb8a8',
        textColor: '#fbf3ea', panelColor: '#2a1d17',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Fredoka', 'Inter', sans-serif",
        cornerRadius: 18, frameStyle: 'tape',
        backdrop: 'rain', textFx: 'marker', lowerThird: 'glass',
    },
    {
        id: 'sketchbook', name: 'Sketchbook',
        accent: '#ff6b6b', accent2: '#4d96ff',
        textColor: '#2b2620', panelColor: '#f6efdf',
        fontFamily: "'Caveat', 'Segoe Print', cursive",
        displayFont: "'Caveat', 'Segoe Print', cursive",
        cornerRadius: 6, frameStyle: 'tape',
        backdrop: 'paper', textFx: 'marker', lowerThird: 'tape',
    },
    {
        id: 'brutalist', name: 'Brutalist',
        accent: '#ffe600', accent2: '#ff3d00',
        textColor: '#ffffff', panelColor: '#0a0a0a',
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        displayFont: "'Anton', 'Impact', sans-serif",
        cornerRadius: 0, frameStyle: 'brutal',
        backdrop: 'halftone', textFx: 'block', lowerThird: 'brutal',
    },
    {
        id: 'pixel', name: 'Pixel Quest',
        accent: '#7cff4f', accent2: '#ff4fd8',
        textColor: '#ffffff', panelColor: '#0d0b1f',
        fontFamily: "'VT323', ui-monospace, monospace",
        displayFont: "'Press Start 2P', 'VT323', monospace",
        cornerRadius: 0, frameStyle: 'pixel',
        backdrop: 'starfield', textFx: 'pixel', lowerThird: 'pixel',
    },
    {
        id: 'y2k', name: 'Y2K Chrome',
        accent: '#9fb4ff', accent2: '#ff7ae0',
        textColor: '#ffffff', panelColor: '#141633',
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        displayFont: "'Space Grotesk', 'Inter', sans-serif",
        cornerRadius: 10, frameStyle: 'window',
        backdrop: 'blobs', textFx: 'chrome', lowerThird: 'window',
    },
    {
        id: 'lavalamp', name: 'Lava Lamp',
        accent: '#b4ff39', accent2: '#ff6ad5',
        textColor: '#ffffff', panelColor: '#120b1a',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Fredoka', 'Inter', sans-serif",
        cornerRadius: 28, frameStyle: 'gradient',
        backdrop: 'blobs', textFx: 'outline', lowerThird: 'glass',
    },
    {
        id: 'sakura', name: 'Sakura',
        accent: '#ffb7c5', accent2: '#c9a7ff',
        textColor: '#fff5f8', panelColor: '#1f1020',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Fredoka', 'Inter', sans-serif",
        cornerRadius: 22, frameStyle: 'glow',
        backdrop: 'petals', textFx: 'neon', lowerThird: 'glass',
    },
    {
        id: 'nouveau', name: 'Nouveau',
        accent: '#e0b354', accent2: '#2a9d8f',
        textColor: '#fbf4e4', panelColor: '#0f1a1a',
        fontFamily: "'Playfair Display', Georgia, serif",
        displayFont: "'Playfair Display', Georgia, serif",
        cornerRadius: 2, frameStyle: 'ornate',
        backdrop: 'sunburst', textFx: 'plain', lowerThird: 'bar',
    },
    {
        id: 'vhs', name: 'VHS Rewind',
        accent: '#ff3b3b', accent2: '#3bd6ff',
        textColor: '#f4f4f4', panelColor: '#0b0b0f',
        fontFamily: "'VT323', ui-monospace, monospace",
        displayFont: "'VT323', ui-monospace, monospace",
        cornerRadius: 0, frameStyle: 'rec',
        backdrop: 'scanlines', textFx: 'glitch', lowerThird: 'bar',
    },
    {
        id: 'rewild', name: 'Rewild',
        accent: '#9bc53d', accent2: '#e9c46a',
        textColor: '#f4f1e8', panelColor: '#132017',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Playfair Display', Georgia, serif",
        cornerRadius: 16, frameStyle: 'tape',
        backdrop: 'waves', textFx: 'plain', lowerThird: 'glass',
    },

    // ── Motif themes ── modelled on the best-selling Streamlabs-library looks
    // (Norse, samurai, night city, sun & moon, Halloween, esports, cats, café).
    {
        id: 'viking', name: 'Valhalla',
        accent: '#ff7a1a', accent2: '#c9d1d9',
        textColor: '#f3ede4', panelColor: '#120d0a',
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        displayFont: "'Cinzel', Georgia, serif",
        cornerRadius: 2, frameStyle: 'ornate',
        backdrop: 'embers', textFx: 'neon', lowerThird: 'bar',
    },
    {
        id: 'samurai', name: 'Samurai',
        accent: '#e63946', accent2: '#f1e4c3',
        textColor: '#f8f1e3', panelColor: '#140a0a',
        fontFamily: "'Inter', system-ui, sans-serif",
        displayFont: "'Shojumaru', 'Inter', sans-serif",
        cornerRadius: 0, frameStyle: 'brutal',
        backdrop: 'seigaiha', textFx: 'slant', lowerThird: 'slant',
    },
    {
        id: 'nightcity', name: 'Night City',
        accent: '#f5e400', accent2: '#00f0ff',
        textColor: '#ffffff', panelColor: '#0a0a12',
        fontFamily: "'Rajdhani', 'Inter', system-ui, sans-serif",
        displayFont: "'Audiowide', 'Rajdhani', sans-serif",
        cornerRadius: 0, frameStyle: 'hud',
        backdrop: 'skyline', textFx: 'glitch', lowerThird: 'slant',
    },
    {
        id: 'celestial', name: 'Sun & Moon',
        accent: '#f2c46d', accent2: '#8fa3ff',
        textColor: '#f7f3ea', panelColor: '#0d1030',
        fontFamily: "'Inter', system-ui, sans-serif",
        displayFont: "'Cinzel', Georgia, serif",
        cornerRadius: 20, frameStyle: 'glow',
        backdrop: 'nightsky', textFx: 'plain', lowerThird: 'glass',
    },
    {
        id: 'spooky', name: 'Spooky Season',
        accent: '#ff7518', accent2: '#9d4edd',
        textColor: '#f5f0ff', panelColor: '#120a1a',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Creepster', 'Fredoka', cursive",
        cornerRadius: 12, frameStyle: 'neon',
        backdrop: 'spooky', textFx: 'retro', lowerThird: 'neon',
    },
    {
        id: 'esports', name: 'Esports',
        accent: '#00c2ff', accent2: '#ff3355',
        textColor: '#ffffff', panelColor: '#0b1020',
        fontFamily: "'Rajdhani', 'Inter', system-ui, sans-serif",
        displayFont: "'Teko', 'Rajdhani', sans-serif",
        cornerRadius: 0, frameStyle: 'hud',
        backdrop: 'halftone', textFx: 'block', lowerThird: 'bar',
    },
    {
        id: 'kitty', name: 'Kitty Café',
        accent: '#ff9ec7', accent2: '#8fd3ff',
        textColor: '#fff7fb', panelColor: '#2a1f33',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Fredoka', 'Inter', sans-serif",
        cornerRadius: 28, frameStyle: 'gradient',
        backdrop: 'paws', textFx: 'marker', lowerThird: 'glass',
    },
    {
        id: 'coffee', name: 'Coffee Lovers',
        accent: '#d4a373', accent2: '#a3b18a',
        textColor: '#fdf6ec', panelColor: '#2b1d14',
        fontFamily: "'Fredoka', 'Inter', system-ui, sans-serif",
        displayFont: "'Pacifico', 'Fredoka', cursive",
        cornerRadius: 16, frameStyle: 'glow',
        backdrop: 'steam', textFx: 'plain', lowerThird: 'tape',
    },
];

export const DEFAULT_THEME = THEMES[0];

export const getTheme = (idOrTheme) => {
    if (idOrTheme && typeof idOrTheme === 'object') return { ...DEFAULT_THEME, ...idOrTheme };
    return THEMES.find(t => t.id === idOrTheme) ?? DEFAULT_THEME;
};

// Maps a token string → the active theme's value. Non-token values (and
// non-strings like numbers) pass through unchanged.
const TOKEN_MAP = {
    '@accent': 'accent',
    '@accent2': 'accent2',
    '@text': 'textColor',
    '@panel': 'panelColor',
    '@radius': 'cornerRadius',
    '@font': 'fontFamily',
    '@frame': 'frameStyle',
    '@backdrop': 'backdrop',
    '@fx': 'textFx',
    '@lt': 'lowerThird',
};

export const resolveToken = (value, theme = DEFAULT_THEME) => {
    if (typeof value === 'string' && value.startsWith('@')) {
        // Headline font falls back to the body font on themes without one.
        if (value === '@display') return theme.displayFont ?? theme.fontFamily;
        const key = TOKEN_MAP[value];
        if (key) return theme[key];
    }
    return value;
};

// Returns a copy of the element with its token-bearing fields resolved against
// the theme. Used by ElementRenderer so the rest of the render path can read
// concrete values without caring about tokens.
export const resolveElement = (element, theme = DEFAULT_THEME) => ({
    ...element,
    fontColor: resolveToken(element.fontColor, theme),
    subFontColor: resolveToken(element.subFontColor, theme),
    bgColor: resolveToken(element.bgColor, theme),
    fillColor: resolveToken(element.fillColor, theme),
    borderRadius: resolveToken(element.borderRadius, theme),
    fontFamily: resolveToken(element.fontFamily, theme),
    frameStyle: resolveToken(element.frameStyle, theme),
    variant: resolveToken(element.variant, theme),
    fx: resolveToken(element.fx, theme),
});
