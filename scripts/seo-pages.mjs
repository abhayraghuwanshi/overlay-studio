// Generate the static search landing pages from seo.config.js.
//
// Runs after `vite build` and writes plain HTML into dist/ — no JS needed to
// read them, so crawlers get the full page. Each template page links into the
// studio with ?studio&kit=<starter id>, which installs that kit on open.
//
//   dist/templates/index.html          hub listing every active page
//   dist/templates/<slug>/index.html   one page per template
//   dist/guides/<slug>/index.html      one page per guide
//   dist/sitemap.xml                   home + hub + every active page
//
//   node scripts/seo-pages.mjs [outDir]   (default: dist)

import fs from 'node:fs'
import path from 'node:path'
import { SITE, REVIEWED, activePages } from '../seo.config.js'
import { STARTER_LAYOUTS } from '../src/scenes/starterLayouts.js'
import { THEMES } from '../src/theme/themes.js'

const OUT = path.resolve(process.argv[2] || 'dist')
const C = { bg: '#0b0b0d', ink: '#f1efe9', dim: 'rgba(241,239,233,0.56)', faint: 'rgba(241,239,233,0.34)', line: 'rgba(241,239,233,0.1)', accent: '#ff6a3d' }

const esc = (s = '') => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
const url = (slug = '') => `${SITE.host}/${slug ? `${slug}/` : ''}`
const starterOf = (page) => STARTER_LAYOUTS.find(s => s.id === page.kit)
const themeOf = (starter) => THEMES.find(t => t.id === starter?.themeId)

// Which section of the hub a page belongs in.
const groupOf = (page) => {
    if (page.slug.startsWith('guides/')) return 'guides'
    if (page.season) return 'seasonal'
    if (starterOf(page)?.tags?.includes('games')) return 'games'
    return 'uses'
}
const GROUPS = [
    { id: 'games', label: 'By game' },
    { id: 'seasonal', label: 'Seasonal' },
    { id: 'uses', label: 'By stream type' },
    { id: 'guides', label: 'Guides' },
]

// The first family in a CSS font stack, for loading it from Google Fonts.
const firstFont = (stack = '') => stack.split(',')[0].replace(/['"]/g, '').trim()

// ── Guide bodies — the "how do I" pages need real steps, not a template ─────
const GUIDES = {
    'guides/add-overlay-to-obs': {
        steps: [
            ['Make your overlay', 'Open the <a href="/?studio">studio</a>, pick a <a href="/templates/">template</a> or start blank, and arrange your cams, text and widgets on the 16:9 canvas.'],
            ['Copy the OBS link', 'Click <strong>Go Live</strong> in the dock. It creates a private room for your overlay and copies its OBS link (it ends in <code>?obs&amp;room=…</code>).'],
            ['Add a Browser source', 'In OBS Studio, click <strong>+</strong> under Sources → <strong>Browser</strong>. Paste the link into <strong>URL</strong>, set <strong>Width 1920</strong> and <strong>Height 1080</strong>, and click OK.'],
            ['Put it on top', 'Drag the browser source above your game or display capture in the Sources list so the overlay sits on top.'],
            ['Edit while live', 'Keep the studio open in your browser. Changes you make there show up in OBS within a few seconds, so there\'s no need to re-add the source.'],
        ],
        faq: [
            ['Why is my overlay blank in OBS?', 'Check that the URL is the OBS link (with <code>?obs</code>), not the editor link, and that the source is above your capture. Right-click the source → <strong>Refresh cache of current page</strong> if it was added before you saved.'],
            ['Why is it cropped or tiny?', 'The overlay is designed at 1920×1080. Set the browser source to exactly that size, then right-click → Transform → <strong>Fit to screen</strong>.'],
            ['Does the background need to be transparent?', 'Yes for gameplay scenes, so your game shows through. OBS renders browser sources with transparency by default; leave the custom CSS box empty.'],
        ],
    },
    'guides/streamlabs-overlay-setup': {
        steps: [
            ['Copy the OBS link', 'Build your overlay in the <a href="/?studio">studio</a> and click <strong>Go Live</strong> to copy its link. The same link works in Streamlabs.'],
            ['Add a Browser Source', 'In Streamlabs Desktop, click <strong>+</strong> in Sources → <strong>Browser Source</strong> → Add Source.'],
            ['Set the size', 'Paste the link into <strong>URL</strong> and set <strong>Width 1920</strong>, <strong>Height 1080</strong>. Click Done.'],
            ['Order your sources', 'Move the browser source above your game capture so the overlay draws on top.'],
        ],
        faq: [
            ['Can I use the same overlay in OBS and Streamlabs?', 'Yes. Both read the same link, and edits in the studio update both.'],
            ['Do I need a Streamlabs account?', 'No. The overlay is just a web page; any app with a browser source can show it.'],
        ],
    },
    'guides/discord-streamkit-alternative': {
        steps: [
            ['Keep StreamKit for voice', 'Discord StreamKit is still the simplest way to show who\'s speaking in your voice channel. Add its voice widget as its own browser source.'],
            ['Build the rest of the overlay here', 'Use the <a href="/?studio">studio</a> for everything around it: cam frames, name plates, follower goals, timers, Twitch chat and scenes for Starting Soon, BRB and Ending.'],
            ['Layer them in OBS', 'Add the Overlay Studio link as a 1920×1080 browser source and place the StreamKit source on top where you want the voice list to appear.'],
        ],
        faq: [
            ['Is this a replacement for Discord StreamKit?', 'Not for the voice widget itself. Overlay Studio doesn\'t read your Discord voice channel. It covers the rest of the overlay that StreamKit doesn\'t.'],
            ['Is Overlay Studio free?', 'Yes, free and open source, with nothing to install.'],
        ],
    },
}

const templateFaq = (page, starter) => [
    ['Is this overlay free?', 'Yes. Overlay Studio is free and open source. Open the template, edit it, and use it on stream with no sign-up and nothing to install.'],
    ['Does it work with Twitch, YouTube and Kick?', 'Yes. The overlay runs in OBS Studio, Streamlabs Desktop, XSplit or Meld Studio as a browser source, so it works with whatever platform you stream to.'],
    ['Can I change the colours and text?', `Yes. Every scene in the ${esc(starter.name)} kit is fully editable: move things around, change the text, swap the theme or add widgets like goals, timers and chat.`],
    ...(groupOf(page) === 'games'
        ? [['Is this an official overlay?', 'No. It\'s a fan-style design inspired by the game and isn\'t affiliated with or endorsed by its publisher. Game names are trademarks of their owners.']]
        : []),
]

// ── Page shell ──────────────────────────────────────────────────────────────
const shell = ({ slug, title, description, body, jsonld = [], fonts = [] }) => {
    const families = ['Inter:wght@400;500;600;700', 'Space+Grotesk:wght@500;700', ...fonts.map(f => `${f.replace(/ /g, '+')}`)]
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="${C.bg}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url(slug)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(SITE.brand)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url(slug)}" />
    <meta name="twitter:card" content="summary" />
${jsonld.map(j => `    <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap" rel="stylesheet" />
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:${C.bg};color:${C.ink};font-family:'Inter',system-ui,sans-serif;line-height:1.6}
      a{color:${C.ink}}
      main,nav,footer{max-width:940px;margin:0 auto;padding:0 20px}
      nav{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;padding-top:24px;font-family:'Space Grotesk',sans-serif;font-size:14px}
      nav a{white-space:nowrap}
      nav a{text-decoration:none;color:${C.dim}} nav a.brand{color:${C.ink};font-weight:700;margin-right:auto}
      .eyebrow{font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${C.faint};margin:56px 0 0}
      h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(34px,6vw,60px);line-height:1.05;letter-spacing:-1px;margin:16px 0 0;max-width:760px}
      h2{font-family:'Space Grotesk',sans-serif;font-size:20px;letter-spacing:-0.3px;margin:48px 0 12px}
      .lead{font-size:17px;color:${C.dim};max-width:600px;margin:22px 0 0}
      .cta{display:inline-block;margin-top:28px;padding:12px 20px;border-radius:999px;background:${C.accent};color:#0b0b0d;font-family:'Space Grotesk',sans-serif;font-weight:700;text-decoration:none}
      .cta + a{margin-left:18px;color:${C.dim};font-size:15px}
      .preview{margin-top:40px;aspect-ratio:16/9;border-radius:14px;border:1px solid ${C.line};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:20px;overflow:hidden}
      .preview .name{font-size:clamp(30px,7vw,72px);line-height:1.1}
      .preview .tag{margin-top:10px;font-size:14px;opacity:.75}
      ul.scenes{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}
      ul.scenes li{border:1px solid ${C.line};border-radius:999px;padding:4px 12px;font-size:14px;color:${C.dim}}
      ol.steps{padding-left:20px;max-width:680px} ol.steps li{margin-bottom:14px;color:${C.dim}} ol.steps strong:first-child{color:${C.ink}}
      dl{max-width:680px} dt{font-weight:600;margin-top:18px} dd{margin:6px 0 0;color:${C.dim}}
      .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
      .card{display:block;padding:16px;border:1px solid ${C.line};border-radius:12px;text-decoration:none}
      .card span{display:block;font-size:13px;color:${C.faint};margin-top:4px}
      .swatch{height:6px;border-radius:3px;margin-bottom:12px}
      code{font-size:.9em;background:rgba(241,239,233,0.08);padding:1px 5px;border-radius:4px}
      footer{margin-top:72px;padding-top:24px;padding-bottom:48px;border-top:1px solid ${C.line};font-size:13px;color:${C.faint}}
      footer a{color:${C.faint}}
    </style>
  </head>
  <body>
    <nav>
      <a class="brand" href="/">${esc(SITE.brand)}</a>
      <a href="/templates/">Templates</a>
      <a href="/guides/add-overlay-to-obs/">OBS guide</a>
      <a href="/?studio">Open the studio</a>
    </nav>
    <main>
${body}
    </main>
    <footer>
      ${esc(SITE.brandLong)} · free, open-source stream overlay editor ·
      <a href="${SITE.github}">GitHub</a> · <a href="/templates/">All templates</a>
    </footer>
  </body>
</html>
`
}

const breadcrumb = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, slug], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(slug) })),
})
const faqLd = (faq) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })),
})
const faqHtml = (faq) => `      <h2>Questions</h2>
      <dl>
${faq.map(([q, a]) => `        <dt>${esc(q)}</dt><dd>${a}</dd>`).join('\n')}
      </dl>`

const card = (page) => {
    const t = themeOf(starterOf(page))
    const swatch = t ? `<div class="swatch" style="background:linear-gradient(90deg,${t.accent},${t.accent2})"></div>` : ''
    const note = starterOf(page)?.tagline
    return `<a class="card" href="/${page.slug}/">${swatch}${esc(page.h1)}${note ? `<span>${esc(note)}</span>` : ''}</a>`
}

const related = (page, pages) => {
    const others = pages.filter(p => p !== page && groupOf(p) === groupOf(page)).slice(0, 6)
    if (!others.length) return ''
    return `      <h2>More ${groupOf(page) === 'guides' ? 'guides' : 'templates'}</h2>
      <div class="grid">
${others.map(p => `        ${card(p)}`).join('\n')}
      </div>`
}

// ── Pages ───────────────────────────────────────────────────────────────────
const templatePage = (page, pages) => {
    const starter = starterOf(page)
    const t = themeOf(starter) ?? {}
    const display = firstFont(t.displayFont)
    const faq = templateFaq(page, starter)
    const body = `      <p class="eyebrow">Free template · OBS &amp; Streamlabs</p>
      <h1>${esc(page.h1)}</h1>
      <p class="lead">${esc(page.intro)}</p>
      <a class="cta" href="/?studio&amp;kit=${encodeURIComponent(starter.id)}">Open this template in the editor →</a>
      <a href="/guides/add-overlay-to-obs/">How to add it to OBS</a>
      <div class="preview" role="img" aria-label="${esc(starter.name)} overlay colours" style="background:linear-gradient(135deg,${t.panelColor || '#111'},#000);color:${t.textColor || C.ink}">
        <div class="name" style="font-family:'${esc(display)}',sans-serif;background:linear-gradient(90deg,${t.accent},${t.accent2});-webkit-background-clip:text;background-clip:text;color:transparent">${esc(starter.name)}</div>
        <div class="tag">${esc(starter.tagline || '')}</div>
      </div>
      <h2>What's in the ${esc(starter.name)} kit</h2>
      <p style="color:${C.dim};max-width:680px">${starter.scenes.length} ready-made scenes that share one theme, so switching from Starting Soon to Gameplay to BRB keeps the same look. Each one is a full layout you can edit.</p>
      <ul class="scenes">
${starter.scenes.map(s => `        <li>${esc(s.name)}</li>`).join('\n')}
      </ul>
      <h2>Use it on stream</h2>
      <ol class="steps">
        <li><strong>Open the template</strong> in the editor with the button above. It's added to your layouts, ready to edit.</li>
        <li><strong>Make it yours</strong>: change your handle and the text, move the cams, and add goals, timers or chat.</li>
        <li><strong>Click Go Live</strong> to copy the OBS link, then add it as a 1920×1080 browser source. <a href="/guides/add-overlay-to-obs/">Full OBS guide</a>.</li>
      </ol>
${faqHtml(faq)}
${related(page, pages)}`
    return shell({
        slug: page.slug,
        title: `${page.h1} | ${SITE.brand}`,
        description: page.intro,
        body,
        fonts: display ? [display] : [],
        jsonld: [breadcrumb([[SITE.brand, ''], ['Templates', 'templates'], [page.h1, page.slug]]), faqLd(faq)],
    })
}

const guidePage = (page, pages) => {
    const g = GUIDES[page.slug]
    if (!g) throw new Error(`No guide body for ${page.slug} — add it to GUIDES in scripts/seo-pages.mjs`)
    const body = `      <p class="eyebrow">Guide</p>
      <h1>${esc(page.h1)}</h1>
      <p class="lead">${esc(page.intro)}</p>
      <h2>Steps</h2>
      <ol class="steps">
${g.steps.map(([h, d]) => `        <li><strong>${esc(h)}.</strong> ${d}</li>`).join('\n')}
      </ol>
      <a class="cta" href="/?studio">Open the studio →</a>
${faqHtml(g.faq)}
${related(page, pages)}
      <h2>Templates to start from</h2>
      <div class="grid">
${pages.filter(p => groupOf(p) === 'games').slice(0, 6).map(p => `        ${card(p)}`).join('\n')}
      </div>`
    return shell({
        slug: page.slug,
        title: `${page.h1} | ${SITE.brand}`,
        description: page.intro,
        body,
        jsonld: [breadcrumb([[SITE.brand, ''], [page.h1, page.slug]]), faqLd(g.faq)],
    })
}

const hubPage = (pages) => {
    const sections = GROUPS.map(g => {
        const inGroup = pages.filter(p => groupOf(p) === g.id)
        if (!inGroup.length) return ''
        return `      <h2>${esc(g.label)}</h2>
      <div class="grid">
${inGroup.map(p => `        ${card(p)}`).join('\n')}
      </div>`
    }).join('\n')
    const body = `      <p class="eyebrow">Free templates</p>
      <h1>Free stream overlay templates for OBS</h1>
      <p class="lead">Ready-made overlay kits for the games and streams people are watching right now. Every kit is a full set of scenes. Open one in the browser, make it yours, and add it to OBS or Streamlabs with one link.</p>
${sections}`
    return shell({
        slug: 'templates',
        title: `Free stream overlay templates for OBS | ${SITE.brand}`,
        description: 'Free stream overlay templates for Twitch, YouTube and Kick: game kits, seasonal themes and Just Chatting layouts. Edit in your browser and add to OBS with one link.',
        body,
        jsonld: [breadcrumb([[SITE.brand, ''], ['Templates', 'templates']])],
    })
}

const sitemap = (pages) => {
    const slugs = ['', 'templates', ...pages.map(p => p.slug)]
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${slugs.map(s => `  <url>
    <loc>${url(s)}</loc>
    <lastmod>${REVIEWED}</lastmod>
  </url>`).join('\n')}
</urlset>
`
}

// ── Write ───────────────────────────────────────────────────────────────────
const write = (rel, html) => {
    const file = path.join(OUT, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, html)
}

const pages = activePages()
for (const page of pages) {
    if (page.kit && !starterOf(page)) throw new Error(`${page.slug}: unknown kit "${page.kit}"`)
    if (!page.h1 || !page.intro) throw new Error(`${page.slug}: needs h1 and intro in seo.config.js`)
    const html = groupOf(page) === 'guides' ? guidePage(page, pages) : templatePage(page, pages)
    write(`${page.slug}/index.html`, html)
}
write('templates/index.html', hubPage(pages))
write('sitemap.xml', sitemap(pages))
console.log(`seo-pages: wrote ${pages.length} pages + hub + sitemap to ${path.relative(process.cwd(), OUT) || '.'}`)
