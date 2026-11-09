/**
 * Search keywords and landing pages for Overlay Studio.
 *
 * One place for what we want to rank for, so the landing pages, sitemap and
 * meta tags all read from the same list. Each page targets ONE primary
 * keyword and points at a real starter kit (src/scenes/starterLayouts.js) so
 * "Open in editor" lands on a finished overlay, not an empty canvas.
 *
 * Evidence is kept next to each keyword so we know why it's here:
 *   - 'search-console'  — the site already gets impressions for it
 *   - 'trend'           — game or season people are streaming right now
 *   - 'kit'             — we ship a matching kit but have no page for it yet
 *
 * Pages are generated at build time by scripts/seo-pages.mjs (h1 + intro are
 * the on-page copy; keep each one specific to its page).
 *
 * Revisit monthly: move seasonal pages in/out of `active`, add any new queries
 * Search Console shows, and bump REVIEWED (used as the sitemap lastmod).
 */

export const REVIEWED = '2026-11-09';

export const SITE = {
    host: 'https://streamoverlay.kazekit.com',
    // Say the brand the same way everywhere so Google ties the name to this
    // site, not to other tools called "Overlay Studio".
    brand: 'Overlay Studio',
    brandLong: 'Overlay Studio by KazeKit',
    github: 'https://github.com/abhayraghuwanshi/overlay-studio',
};

// Brand searches we should own. These already show up in Search Console with
// 0 clicks, which means the GitHub repo or another product is ranking instead.
export const BRAND_KEYWORDS = [
    'overlay studio',
    'overlaystudio',
    'overlay studio github',
    'overlay studio obs',
    'kazekit overlay',
];

// Homepage targets — broad, high-intent "I want a tool" searches.
export const HOME_KEYWORDS = {
    primary: 'free stream overlay maker',
    secondary: [
        'obs overlay maker',            // search-console
        'obs studio stream overlay',    // search-console
        'online stream overlay editor',
        'stream overlay maker no download',
        'twitch overlay maker',
        'youtube live overlay',
        'kick stream overlay',
    ],
};

// Landing pages, highest priority first. `active: false` keeps the entry for
// next season without publishing it.
export const PAGES = [
    // ── Games — trending now ────────────────────────────────────────────────
    {
        slug: 'templates/gta-6-stream-overlay',
        h1: 'Free GTA 6 stream overlay for OBS',
        intro: 'GTA VI lands on November 19. Go live with a Vice-inspired overlay: a neon skyline, an ocean sunset and pink-and-teal plates, with every scene from Starting Soon to Offline ready to go.',
        primary: 'gta 6 stream overlay',
        secondary: ['gta vi overlay obs', 'gta 6 twitch overlay', 'vice city stream overlay'],
        kit: 'kit-gta6',
        evidence: ['trend', 'kit'],
        why: 'GTA VI launches 2026-11-19; the biggest streaming launch of the year.',
        priority: 1, active: true,
    },
    {
        slug: 'templates/fortnite-stream-overlay',
        h1: 'Free Fortnite stream overlay for OBS',
        intro: 'A purple-storm overlay with loot-glow plates and a round facecam, built for Fortnite streams. Every scene is ready, and you edit it in your browser before adding it to OBS with one link.',
        primary: 'fortnite stream overlay',
        secondary: ['fortnite obs overlay', 'fortnite twitch overlay free'],
        kit: 'kit-fortnite',
        evidence: ['trend', 'kit'],
        why: '#1 on TwitchTracker by live channels (Nov 2026).',
        priority: 1, active: true,
    },
    {
        slug: 'templates/cs2-faceit-overlay',
        h1: 'Free CS2 & FACEIT overlay for OBS',
        intro: 'A Counter-Strike 2 overlay in desert tones, with smoke and tracer effects and name plates you can use for your FACEIT level or rank. Customise it in the browser and drop it into OBS as a browser source.',
        primary: 'faceit obs overlay',
        secondary: ['cs2 stream overlay', 'counter strike 2 overlay obs', 'faceit elo overlay'],
        kit: 'kit-cs2',
        evidence: ['search-console', 'trend', 'kit'],
        why: 'Already getting impressions; CS is top-2 on Twitch hours watched in 2026.',
        priority: 1, active: true,
    },
    {
        slug: 'templates/league-of-legends-stream-overlay',
        h1: 'Free League of Legends stream overlay',
        intro: 'Rune circles and gold-and-teal plates for League streams. It includes a gameplay scene that keeps the minimap and HUD clear, plus Starting Soon, BRB and Ending screens.',
        primary: 'league of legends stream overlay',
        secondary: ['lol twitch overlay', 'league obs overlay free'],
        kit: 'kit-league',
        evidence: ['trend', 'kit'],
        why: 'Most-watched game on Twitch Jan–Sep 2026.',
        priority: 2, active: true,
    },
    {
        slug: 'templates/valorant-stream-overlay',
        h1: 'Free Valorant stream overlay for OBS',
        intro: 'Angular shards, slanted name plates and Valorant red. A full set of scenes for ranked grinds and Premier nights, editable in your browser and live in OBS with one link.',
        primary: 'valorant stream overlay',
        secondary: ['valorant obs overlay', 'valorant twitch overlay free'],
        kit: 'kit-valorant',
        evidence: ['trend', 'kit'],
        why: 'Top-5 on Twitch hours watched in 2026.',
        priority: 2, active: true,
    },
    {
        slug: 'templates/gta-rp-stream-overlay',
        h1: 'Free GTA RP stream overlay for OBS',
        intro: 'Sunset palms, wanted stars and a duo scene for RP sessions. Built for long GTA V roleplay streams where your character name and the server need to stay on screen.',
        primary: 'gta rp stream overlay',
        secondary: ['gta 5 stream overlay', 'gta roleplay overlay obs'],
        kit: 'kit-gta',
        evidence: ['trend', 'kit'],
        why: 'GTA V is top-3 on Twitch in 2026 and RP streams run all day.',
        priority: 2, active: true,
    },
    {
        slug: 'templates/minecraft-stream-overlay',
        h1: 'Free Minecraft stream overlay for OBS',
        intro: 'Pixel terrain, a square moon and blocky type. A cozy Minecraft overlay with gameplay, just chatting and duo scenes for survival, hardcore and build streams.',
        primary: 'minecraft stream overlay',
        secondary: ['minecraft obs overlay', 'minecraft twitch overlay free'],
        kit: 'kit-minecraft',
        evidence: ['kit'],
        priority: 3, active: true,
    },
    {
        slug: 'templates/warzone-stream-overlay',
        h1: 'Free Warzone stream overlay for OBS',
        intro: 'A radar sweep, tactical green and stencil type for Call of Duty: Warzone streams. Every scene is ready, from the pre-game lobby to the Ending screen.',
        primary: 'warzone stream overlay',
        secondary: ['cod stream overlay', 'call of duty obs overlay'],
        kit: 'kit-warzone',
        evidence: ['kit'],
        priority: 3, active: true,
    },
    {
        slug: 'templates/apex-legends-stream-overlay',
        h1: 'Free Apex Legends stream overlay',
        intro: 'A closing ring, a hex grid and a trios-ready duo scene in Apex red and orange. Edit it in your browser and add it to OBS with one link.',
        primary: 'apex legends stream overlay',
        secondary: ['apex obs overlay'],
        kit: 'kit-apex',
        evidence: ['kit'],
        priority: 3, active: true,
    },
    {
        slug: 'templates/pubg-stream-overlay',
        h1: 'Free PUBG & BGMI stream overlay',
        intro: 'A zone map, airdrops and stencil type for PUBG and BGMI streams, with a squad duo scene for playing with friends.',
        primary: 'pubg stream overlay',
        secondary: ['bgmi stream overlay', 'pubg mobile obs overlay'],
        kit: 'kit-battlegrounds',
        evidence: ['kit'],
        priority: 3, active: true,
    },
    {
        slug: 'templates/free-fire-stream-overlay',
        h1: 'Free Free Fire stream overlay',
        intro: 'Roaring flames and rising embers in fire orange, with a squad duo scene. It works for PC streams and for mobile games captured into OBS.',
        primary: 'free fire stream overlay',
        secondary: ['free fire obs overlay', 'free fire live overlay'],
        kit: 'kit-freefire',
        evidence: ['kit'],
        priority: 3, active: true,
    },
    {
        slug: 'templates/roblox-stream-overlay',
        h1: 'Free Roblox stream overlay for OBS',
        intro: 'Floating stud platforms, bright blue and yellow, and a round cam. A friendly overlay for obbies, tycoons and whatever the chat picks next.',
        primary: 'roblox stream overlay',
        secondary: ['roblox obs overlay', 'roblox twitch overlay'],
        kit: 'kit-roblox',
        evidence: ['kit'],
        priority: 3, active: true,
    },

    // ── Seasonal — publish ~4 weeks before the date ──────────────────────────
    {
        slug: 'templates/christmas-stream-overlay',
        h1: 'Free Christmas stream overlay for OBS',
        intro: 'Snowfall, fairy lights and a round cam for holiday streams. Turn it on for December and switch back to your usual look in one click.',
        primary: 'christmas stream overlay',
        secondary: ['christmas twitch overlay free', 'holiday stream overlay obs', 'winter stream overlay'],
        kit: 'kit-christmas',
        evidence: ['trend', 'kit'],
        season: { from: '11-01', to: '12-31' },
        priority: 1, active: true,
    },
    {
        slug: 'templates/new-year-countdown-overlay',
        h1: 'Free New Year countdown overlay',
        intro: 'Fireworks, gold chrome type and a live countdown to midnight. Run your New Year\'s Eve stream with a timer your chat can watch tick down.',
        primary: 'new year countdown overlay',
        secondary: ['new years eve stream overlay', 'countdown overlay obs'],
        kit: 'kit-new-year',
        evidence: ['trend', 'kit'],
        season: { from: '12-01', to: '01-05' },
        priority: 1, active: true,
    },
    {
        slug: 'templates/lunar-new-year-stream-overlay',
        primary: 'lunar new year stream overlay',
        kit: 'kit-lunar',
        evidence: ['kit'],
        season: { from: '01-10', to: '02-28' },
        priority: 3, active: false,
    },
    {
        slug: 'templates/valentines-stream-overlay',
        primary: 'valentines stream overlay',
        kit: 'kit-valentine',
        evidence: ['kit'],
        season: { from: '01-20', to: '02-15' },
        priority: 3, active: false,
    },
    {
        slug: 'templates/halloween-stream-overlay',
        primary: 'halloween stream overlay',
        secondary: ['spooky twitch overlay'],
        kit: 'kit-spooky',
        evidence: ['kit'],
        season: { from: '09-25', to: '10-31' },
        priority: 2, active: false,
    },
    {
        slug: 'templates/diwali-stream-overlay',
        primary: 'diwali stream overlay',
        kit: 'kit-diwali',
        evidence: ['kit'],
        season: { from: '10-01', to: '11-15' },
        priority: 3, active: false,
    },

    // ── Use cases ──────────────────────────────────────────────────────────
    {
        slug: 'templates/just-chatting-overlay',
        h1: 'Free Just Chatting overlay for OBS',
        intro: 'A rainy window, glass plates and a calm lo-fi palette. Made for Just Chatting, study-with-me and art streams where your face cam takes centre stage.',
        primary: 'just chatting overlay',
        secondary: ['cozy stream overlay', 'lofi stream overlay'],
        kit: 'kit-lofi-cafe',
        evidence: ['kit'],
        priority: 2, active: true,
    },
    {
        slug: 'templates/starting-soon-screen',
        h1: 'Free Starting Soon, BRB & Ending screens',
        intro: 'A Starting Soon screen with a live countdown, plus matching Be Right Back, Ending and Offline scenes. Add them to OBS as one browser source and switch scenes from the dock.',
        primary: 'starting soon screen obs',
        secondary: ['stream starting soon overlay', 'brb screen obs', 'stream ending screen'],
        kit: 'kit-tactical-hud',
        evidence: ['kit'],
        priority: 2, active: true,
    },
    {
        slug: 'templates/esports-scoreboard-overlay',
        h1: 'Free esports scoreboard overlay',
        intro: 'A broadcast-desk look with bold plates, a casters\' duo scene and a live scoreboard. Built for tournaments, scrims and watch parties.',
        primary: 'esports scoreboard overlay',
        secondary: ['live score overlay obs', 'tournament stream overlay'],
        kit: 'kit-esports',
        evidence: ['kit'],
        priority: 2, active: true,
    },

    // ── Guides — answer the "how do I" searches ─────────────────────────────
    {
        slug: 'guides/add-overlay-to-obs',
        h1: 'How to add an overlay to OBS Studio',
        intro: 'Add any web overlay to OBS Studio as a browser source in under a minute. Here are the exact settings, plus fixes for a blank or cropped overlay.',
        primary: 'how to add overlay to obs',
        secondary: ['obs browser source overlay', 'add stream overlay obs studio'],
        evidence: ['search-console'],
        priority: 1, active: true,
    },
    {
        slug: 'guides/streamlabs-overlay-setup',
        h1: 'How to add an overlay to Streamlabs Desktop',
        intro: 'Streamlabs Desktop takes web overlays as a browser source too. Here\'s how to add an Overlay Studio link and size it correctly.',
        primary: 'how to add overlay to streamlabs',
        secondary: ['streamlabs browser source'],
        priority: 2, active: true,
    },
    {
        slug: 'guides/discord-streamkit-alternative',
        h1: 'A Discord StreamKit overlay alternative',
        intro: 'Discord StreamKit shows who\'s talking in your voice channel. If you want a complete stream overlay with cams, goals, timers and scenes around it, here\'s how Overlay Studio fits next to it.',
        primary: 'discord streamkit overlay alternative',
        secondary: ['streamkit overlay', 'obs streamkit'],
        evidence: ['search-console'],
        why: '"streamkit" queries reach us; searchers mean Discord StreamKit, so frame this as an alternative, not a match.',
        priority: 3, active: true,
    },
];

// Pages that should be live today, highest priority first.
export const activePages = () =>
    PAGES.filter(p => p.active).sort((a, b) => a.priority - b.priority);
