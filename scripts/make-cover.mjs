// Renders the playlist / thumbnail cover from the ?showcase&cover page.
//
//   npm run dev            # in another terminal
//   npm run promo:cover    # → promo-videos/cover.png (1280×720) + cover@2x.png
//
// Uses your installed Google Chrome via playwright-core, like record-showcase.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { PORTS } from '../ports.config.js';

const urlArg = process.argv.find(a => a.startsWith('--url='));
const BASE = urlArg ? urlArg.slice(6) : `http://localhost:${PORTS.FRONTEND}`;
const OUT = path.resolve('promo-videos');

const main = async () => {
    const res = await fetch(BASE).catch(() => null);
    if (!res?.ok) throw new Error(`Can't reach ${BASE}. Start the app with \`npm run dev\` first (or pass --url=…).`);
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        for (const [scale, file] of [[1, 'cover.png'], [2, 'cover@2x.png']]) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: scale });
            await page.goto(`${BASE}/?showcase&cover`, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            await page.waitForFunction(() => window.__coverReady === true);
            await page.waitForTimeout(2500);   // let backdrops and the alert animation settle
            await page.screenshot({ path: path.join(OUT, file) });
            await page.close();
            console.log(`✓ ${path.relative(process.cwd(), path.join(OUT, file))} (${1280 * scale}×${720 * scale})`);
        }
    } finally {
        await browser.close();
    }
};

main().catch(e => { console.error(e.message); process.exit(1); });
