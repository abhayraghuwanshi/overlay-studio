// Styled frames for camera feeds. A frame wraps a VideoFeed and applies a
// border / glow / shape so the cam reads as a designed element rather than a
// bare rectangle. Frames are pure CSS so they composite correctly into the
// recording canvas and OBS.

export const CAMERA_FRAMES = [
    { id: 'none',     label: 'None' },
    { id: 'soft',     label: 'Soft' },
    { id: 'ring',     label: 'Ring' },
    { id: 'neon',     label: 'Neon' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'glass',    label: 'Glass' },
    { id: 'circle',   label: 'Circle' },
    { id: 'hexagon',  label: 'Hexagon' },
    { id: 'diamond',  label: 'Diamond' },
];

// Polygon frames: the video is clipped to the shape and an SVG outline is
// drawn on top (a border can't follow a clip-path). In OBS the overlay cuts a
// matching hole in the background, see sceneHoles() in graphics.jsx.
const POLYGONS = {
    hexagon: [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]],
    diamond: [[50, 0], [100, 50], [50, 100], [0, 50]],
};

const PolygonFrame = ({ points, accent, accent2, children }) => {
    const clip = `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
    const id = `pf-${points.length}-${String(accent).replace(/\W/g, '')}`;
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', filter: `drop-shadow(0 0 12px ${accent}55) drop-shadow(0 10px 24px rgba(0,0,0,0.5))` }}>
            <div style={{ width: '100%', height: '100%', clipPath: clip, overflow: 'hidden' }}>{children}</div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor={accent} />
                        <stop offset="1" stopColor={accent2 || accent} />
                    </linearGradient>
                </defs>
                <polygon points={points.map(p => p.join(',')).join(' ')} fill="none" stroke={`url(#${id})`} strokeWidth="5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
        </div>
    );
};

export const DEFAULT_CAM_STYLE = { frame: 'soft', radius: 14 };

// Returns { outer, inner } style objects. `outer` carries the visible frame
// (border / glow / gradient padding); `inner` clips the video to the matching
// radius so corners stay clean.
const buildFrame = (frame, accent, accent2, radius) => {
    const r = typeof radius === 'number' ? radius : 14;
    const clip = { overflow: 'hidden' };
    switch (frame) {
        case 'soft':
            return {
                outer: { borderRadius: r, ...clip, boxShadow: '0 10px 34px rgba(0,0,0,0.55)' },
                inner: { borderRadius: r, ...clip },
            };
        case 'ring':
            return {
                outer: { borderRadius: r, ...clip, border: `3px solid ${accent}`, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' },
                inner: { borderRadius: Math.max(r - 3, 0), ...clip },
            };
        case 'neon':
            return {
                outer: {
                    borderRadius: r, ...clip, border: `2px solid ${accent}`,
                    boxShadow: `0 0 14px ${accent}66, 0 0 34px ${accent}26`,
                },
                inner: { borderRadius: Math.max(r - 2, 0), ...clip },
            };
        case 'gradient':
            return {
                outer: {
                    borderRadius: r, padding: 3,
                    background: `linear-gradient(135deg, ${accent}, ${accent2 || accent})`,
                    boxShadow: '0 10px 34px rgba(0,0,0,0.55)',
                },
                inner: { borderRadius: Math.max(r - 3, 0), ...clip },
            };
        case 'glass':
            return {
                outer: {
                    borderRadius: r, padding: 1.5,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.25))',
                    boxShadow: '0 10px 34px rgba(0,0,0,0.5)',
                },
                inner: { borderRadius: Math.max(r - 1.5, 0), ...clip },
            };
        case 'circle':
            return {
                outer: {
                    borderRadius: '50%', ...clip, border: `3px solid ${accent}`,
                    boxShadow: `0 0 18px ${accent}33, 0 8px 30px rgba(0,0,0,0.5)`,
                },
                inner: { borderRadius: '50%', ...clip },
            };
        default:
            return { outer: {}, inner: {} };
    }
};

const CameraFrame = ({ frame = 'none', accent = '#6366f1', accent2, radius, children }) => {
    if (POLYGONS[frame]) {
        return <PolygonFrame points={POLYGONS[frame]} accent={accent} accent2={accent2}>{children}</PolygonFrame>;
    }
    if (!frame || frame === 'none') {
        return <div style={{ width: '100%', height: '100%' }}>{children}</div>;
    }
    const { outer, inner } = buildFrame(frame, accent, accent2, radius);
    return (
        <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', ...outer }}>
            <div style={{ width: '100%', height: '100%', ...inner }}>{children}</div>
        </div>
    );
};

export default CameraFrame;
