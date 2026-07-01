import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { BackgroundProcessor, supportsBackgroundProcessors } from '@livekit/track-processors';

// Brand-matched gradient "virtual backgrounds". Generated on a canvas → data URL
// so they're same-origin and always drawable by the segmenter (external image
// URLs would taint the processing canvas and fail unless they send CORS headers).
const GRADIENTS = [
    { id: 'purple', label: 'Purple', colors: ['#7567C9', '#2e2568'] },
    { id: 'blue', label: 'Ocean', colors: ['#0ea5e9', '#0b3550'] },
    { id: 'green', label: 'Forest', colors: ['#10b981', '#064e3b'] },
    { id: 'warm', label: 'Sunset', colors: ['#f59e0b', '#7c2d12'] },
];

function gradientDataURL(colors) {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    colors.forEach((col, i) => g.addColorStop(i / Math.max(1, colors.length - 1), col));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/png');
}

// Map our effect state → the options the processor understands.
const toOptions = (e) =>
    e.mode === 'background-blur'
        ? { mode: 'background-blur', blurRadius: e.blurRadius ?? 12 }
        : { mode: 'virtual-background', imagePath: e.imagePath };

// The segmenter (WASM runtime + selfie-segmentation model) is fetched by
// default from cdn.jsdelivr.net and storage.googleapis.com — both blocked by
// this app's CSP (vercel.json only whitelists our own API + payment origins).
// Self-hosting under /mediapipe (copied from node_modules/@mediapipe/tasks-vision
// at build time — see scripts/copyMediapipeAssets.* or the public/ dir directly)
// keeps every fetch same-origin so no CSP change is needed for connect-src.
const ASSET_PATHS = {
    tasksVisionFileSet: '/mediapipe/wasm',
    modelAssetPath: '/mediapipe/selfie_segmenter.tflite',
};

const BLUR = { mode: 'background-blur', blurRadius: 14 };

/**
 * Floating control that lets a participant blur or replace their own camera
 * background. The effect is applied to the LOCAL camera track, so the other
 * side sees it automatically — no data channel needed. Persists across camera
 * on/off (re-applies whenever a new camera track is published).
 */
export default function BackgroundControl({ top = 14, right = 14 }) {
    const { cameraTrack } = useLocalParticipant();
    const [open, setOpen] = useState(false);
    // { mode:'disabled' } | { mode:'background-blur', blurRadius } | { mode:'virtual-background', imagePath, custom? }
    const [effect, setEffect] = useState({ mode: 'disabled' });

    const procRef = useRef(null);
    const attachedTrackRef = useRef(null);
    const customUrlRef = useRef(null); // object URL for an uploaded image (revoked on replace/unmount)

    const gradients = useMemo(
        () => GRADIENTS.map((g) => ({ ...g, url: gradientDataURL(g.colors) })),
        [],
    );

    // Apply the selected effect to the current camera track. Re-runs when the
    // effect changes OR the underlying track is replaced (camera toggled).
    useEffect(() => {
        const track = cameraTrack?.track;
        if (!track) return;
        let cancelled = false;
        (async () => {
            try {
                if (effect.mode === 'disabled') {
                    if (procRef.current) {
                        await track.stopProcessor();
                        procRef.current = null;
                        attachedTrackRef.current = null;
                    }
                    return;
                }
                // Fresh track (or first enable) → create + attach a processor.
                // assetPaths only takes effect at construction time (per the
                // library's own docs it "cannot be updated through the update
                // method, needs a restart"), so it's merged in here, not in
                // toOptions (which also feeds switchTo on an already-attached track).
                if (attachedTrackRef.current !== track || !procRef.current) {
                    procRef.current = BackgroundProcessor({ ...toOptions(effect), assetPaths: ASSET_PATHS });
                    await track.setProcessor(procRef.current);
                    attachedTrackRef.current = track;
                } else {
                    // Same track, changing modes → switch in place (no flicker).
                    await procRef.current.switchTo(toOptions(effect));
                }
            } catch (err) {
                if (!cancelled) console.error('[background] apply failed:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [cameraTrack?.track, effect]);

    // Release the segmentation worker + any uploaded image URL on unmount.
    useEffect(() => {
        return () => {
            const track = attachedTrackRef.current;
            if (track && procRef.current) track.stopProcessor().catch(() => {});
            if (customUrlRef.current) URL.revokeObjectURL(customUrlRef.current);
        };
    }, []);

    if (!supportsBackgroundProcessors()) return null;

    const onUpload = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (customUrlRef.current) URL.revokeObjectURL(customUrlRef.current);
        const url = URL.createObjectURL(file);
        customUrlRef.current = url;
        setEffect({ mode: 'virtual-background', imagePath: url, custom: true });
    };

    const isActive = effect.mode !== 'disabled';
    const activeImage = effect.mode === 'virtual-background' ? effect.imagePath : null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="Change background"
                aria-label="Change background"
                style={{ ...btn(top, right), ...(isActive ? btnActive : null) }}
            >
                <BgIcon />
            </button>

            {open && (
                <div style={panel(top + 52, right)} role="dialog" aria-label="Background effects">
                    <div style={panelTitle}>Background</div>
                    <div style={grid}>
                        <Swatch
                            label="None"
                            active={effect.mode === 'disabled'}
                            onClick={() => setEffect({ mode: 'disabled' })}
                        >
                            <NoneIcon />
                        </Swatch>
                        <Swatch
                            label="Blur"
                            active={effect.mode === 'background-blur'}
                            onClick={() => setEffect(BLUR)}
                        >
                            <BlurIcon />
                        </Swatch>
                        {gradients.map((g) => (
                            <Swatch
                                key={g.id}
                                label={g.label}
                                active={activeImage === g.url}
                                onClick={() =>
                                    setEffect({ mode: 'virtual-background', imagePath: g.url })
                                }
                                thumb={g.url}
                            />
                        ))}
                        <label
                            style={{ ...swatchBox, ...(effect.custom ? swatchActive : null), cursor: 'pointer' }}
                            title="Upload image"
                        >
                            {effect.custom && activeImage ? (
                                <span
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: 8,
                                        backgroundImage: `url(${activeImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                            ) : (
                                <UploadIcon />
                            )}
                            <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                    <div style={hint}>Only you can set your own background.</div>
                </div>
            )}
        </>
    );
}

function Swatch({ label, active, onClick, thumb, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            style={{
                ...swatchBox,
                ...(active ? swatchActive : null),
                ...(thumb
                    ? { backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : null),
            }}
        >
            {children}
        </button>
    );
}

/* ── icons ── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const BgIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.6" />
        <path d="m21 15-5-5L5 21" />
    </svg>
);
const NoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="9" />
        <path d="m5 5 14 14" />
    </svg>
);
const BlurIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="5" r="1.3" /><circle cx="12" cy="19" r="1.3" />
        <circle cx="5" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" />
        <circle cx="7" cy="7" r="1" /><circle cx="17" cy="7" r="1" />
        <circle cx="7" cy="17" r="1" /><circle cx="17" cy="17" r="1" />
    </svg>
);
const UploadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" />
    </svg>
);

/* ── styles ── */
const btn = (top, right) => ({
    position: 'fixed',
    top,
    right,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(20,20,26,0.72)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
});
const btnActive = { background: '#7567C9', borderColor: '#7567C9' };
const panel = (top, right) => ({
    position: 'fixed',
    top,
    right,
    zIndex: 1000,
    width: 232,
    padding: 14,
    borderRadius: 14,
    background: 'rgba(24,24,30,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 12px 34px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
});
const panelTitle = { color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 10, letterSpacing: '0.02em' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 };
const swatchBox = {
    position: 'relative',
    aspectRatio: '1 / 1',
    borderRadius: 8,
    border: '2px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
};
const swatchActive = { borderColor: '#7567C9', boxShadow: '0 0 0 2px rgba(117,103,201,0.4)' };
const hint = { color: 'rgba(255,255,255,0.5)', fontSize: 10.5, marginTop: 10, lineHeight: 1.35 };
