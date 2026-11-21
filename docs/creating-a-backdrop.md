# Creating a new backdrop

A **backdrop** is full-canvas animated scenery (Starfield, Rain, Synth grid…) that
streamers add from **Add to scene → Graphics → Backdrop** and pick in the
editor's **Scenery** dropdown.

Every backdrop is a plain React component made of absolutely positioned
`<div>`/`<span>` elements animated with CSS `@keyframes`. There is no canvas,
WebGL or `requestAnimationFrame` loop, which keeps them cheap and smooth inside
an OBS browser source.

## How a backdrop gets rendered

```
element data ──► resolveElement() ──► ElementRenderer ──► <Backdrop> ──► BACKDROP_MAP[id]
{ type: 'backdrop',   '@backdrop' →     type === 'backdrop'   mask + wrapper    your component
  variant: '@backdrop',  theme.backdrop
  box: {0,0,100,100} }
```

| Step | Where | What happens |
|---|---|---|
| Element data | `defaultElement` in `src/components/ElementRenderer.jsx` | A backdrop is `{ type: 'backdrop', variant, box }`. `box` is in percent of the 1920×1080 canvas; the default fills it. |
| Theme token | `resolveElement` in `src/theme/themes.js` | `variant: '@backdrop'` ("Theme default") is replaced with the active theme's `backdrop` id. |
| Render | `ElementRenderer.jsx` (`type === 'backdrop'`) | Renders `<Backdrop variant T opacity holes box />`. |
| Wrapper | `Backdrop` in `src/components/graphics.jsx` | Looks up `BACKDROP_MAP[variant]` (falls back to `Bokeh`), clips it, sets `pointerEvents: 'none'`, and applies the camera-hole mask. |
| Scenery | your component in `graphics.jsx` | Draws the animation, using the theme colours it is given. |

## Step by step

### 1. Write the component (`src/components/graphics.jsx`)

Put it next to the other backdrop components (above `BACKDROP_MAP`). It receives
the theme's colours as props:

| Prop | Theme field | Use it for |
|---|---|---|
| `a` | `accent` | main colour |
| `b` | `accent2` (falls back to `accent`) | secondary colour |
| `panel` | `panelColor` | dark base / fills |
| `text` | `textColor` | light details |

```jsx
const Aurora = ({ a, b }) => (
    <div style={{ ...fill, overflow: 'hidden' }}>
        {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
                position: 'absolute',
                left: `${-20 + rand(i, 40) * 80}%`,
                top: `${rand(i, 41) * 50}%`,
                width: '70%', height: '35%',
                borderRadius: '50%',
                filter: 'blur(60px)',
                background: rgba(i % 2 ? a : b, 0.35),
                animation: `auroraDrift ${18 + rand(i, 42) * 14}s ease-in-out ${-rand(i, 43) * 30}s infinite alternate`,
            }} />
        ))}
    </div>
);
```

Helpers already in `graphics.jsx`:

- **`fill`**: `{ position: 'absolute', inset: 0, pointerEvents: 'none' }`. Spread it on your root.
- **`rand(i, salt)`**: seeded pseudo-random in `[0, 1)`. **Always use this, never
  `Math.random()`.** The same inputs give the same output, so the layout is identical
  in the editor preview, the template gallery and OBS, and nothing jumps on
  re-render. Use a different `salt` for each property (x, y, size, duration…)
  so they don't correlate. Pick salts not used nearby to avoid repeating another
  backdrop's pattern.
- **`rgba(hex, alpha)`**: hex colour to `rgba()`. Non-hex values pass through unchanged.
- **`Faller`**: a column that falls top to bottom forever (used by Rain, Petals,
  Snowfall). `<Faller i={i} left="40%" dur={3}>{child}</Faller>`.

### 2. Add keyframes (`src/index.css`)

Reuse an existing one if it fits (`twinkle`, `bokehFloat`, `fallDown`, `drift`,
`spinSlow`, `riseUp`, `blobDrift`…). Otherwise add yours with the others at the
top of the file:

```css
@keyframes auroraDrift { from { transform: translateX(-6%) scaleY(0.9); } to { transform: translateX(6%) scaleY(1.1); } }
```

### 3. Register it (`src/components/graphics.jsx`)

Add it in **two** places:

```js
export const BACKDROPS = [
    // …
    { id: 'aurora', label: 'Aurora' },     // shows in the editor's Scenery dropdown
];

const BACKDROP_MAP = {
    // …
    aurora: Aurora,                        // id → component
};
```

The `id` is what gets saved in layouts. **Don't rename or remove an existing id**,
or saved layouts using it fall back to Bokeh.

### 4. (Optional) Make it a theme's default (`src/theme/themes.js`)

```js
backdrop: 'aurora',
```

Any backdrop left on "Theme default" (`'@backdrop'`) then uses it with that theme.

### 5. (Optional) Use it in a template (`src/scenes/starterLayouts.js`)

The `backdrop()` helper builds the element; pin a variant with `extra`:

```js
backdrop({ variant: 'aurora', opacity: 0.8 }),
```

## Rules of thumb

- **Animate only `transform` and `opacity`.** They run on the GPU. Animating
  `top`/`left`/`width`, `filter` or `box-shadow` will stutter in OBS.
- **Keep the element count modest.** Most backdrops use 20–90 nodes. A few
  hundred is the ceiling.
- **Use negative `animation-delay`** (`-rand(i, n) * duration`) so pieces start
  mid-cycle instead of all moving in sync on load.
- **Stay subtle.** Text, timers and alerts sit on top. Keep alphas low (0.1–0.4)
  and avoid bright flashes covering the centre of the screen.
- **Colour from props, not hard-coded.** Using `a`/`b` lets the backdrop match all
  themes. Hard-code only neutrals or deliberately themed scenery (pumpkins, diyas).
- **The root must fill and clip:** `{ ...fill, overflow: 'hidden' }`.
- **Don't add pointer handlers.** The wrapper sets `pointerEvents: 'none'` so the
  canvas stays clickable.

## Camera holes (no work needed)

`Backdrop` applies `holeMask(holes, box)`: an SVG `mask-image` with an
`evenodd` path that cuts out every visible camera (in its frame shape) and any cam
frame marked as a hole. OBS camera sources underneath show through, and your
component doesn't need to know about it.

## Checking it

1. `npm run dev`, add a Backdrop, and pick yours under **Scenery**.
2. Switch a few themes (with "Theme default" and with yours pinned) to check
   the colours work on light and dark palettes.
3. Turn on a camera and confirm the hole cuts through.
4. Open the OBS URL in a browser (or OBS itself) and watch CPU for a minute.
5. `npm run lint`.
