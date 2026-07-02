import { useEffect, useRef, useState } from 'react';
import { authAPI } from '../../api';

// Lets a participant pull up their OWN resume during the call instead of
// switching tabs to find it. Reads whatever the profile API returns — the
// backend doesn't currently expose the exact field name to this repo, so a
// few common shapes are checked defensively and it falls back to an empty
// state rather than guessing wrong.
//
// NOTE on scope: this shows "my resume", not "the other participant's resume".
// Surfacing the mentor's view of the *student's* resume would need the
// backend to attach a resumeUrl to the LiveKit participant metadata at token
// mint (or a lookup-by-userId endpoint) — neither exists yet in this repo.
function extractResumeUrl(user) {
    if (!user) return null;
    return (
        user.resumeUrl ||
        user.resumePdfUrl ||
        user.resumeLink ||
        user.resume?.url ||
        user.profile?.resumeUrl ||
        null
    );
}

// PDF viewers in an <iframe>/<embed> pointed straight at a Cloudinary URL are
// blocked by this app's CSP (vercel.json's frame-src only allows Razorpay).
// Fetching the bytes ourselves (res.cloudinary.com IS allowed in connect-src)
// and framing the resulting same-origin blob: URL sidesteps that without
// loosening the CSP. If a browser still won't render the blob inline, the
// "Open in new tab" link (the real https URL) always works as a fallback.
function useBlobUrl(sourceUrl) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [failed, setFailed] = useState(false);
    const revokeRef = useRef(null);

    useEffect(() => {
        if (!sourceUrl) return;
        let cancelled = false;
        fetch(sourceUrl)
            .then((res) => {
                if (!res.ok) throw new Error('fetch failed');
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                revokeRef.current = url;
                setBlobUrl(url);
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [sourceUrl]);

    useEffect(() => () => {
        if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
    }, []);

    return { blobUrl, failed };
}

export default function ResumePanel({ top = 14, left = 14 }) {
    const [open, setOpen] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [checked, setChecked] = useState(false);
    const loading = open && !checked;

    const { blobUrl, failed } = useBlobUrl(resumeUrl);

    // Fetch lazily — only once the panel is opened the first time.
    useEffect(() => {
        if (!open || checked) return;
        authAPI.me()
            .then((user) => setResumeUrl(extractResumeUrl(user)))
            .catch(() => setResumeUrl(null))
            .finally(() => setChecked(true));
    }, [open, checked]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="My resume"
                aria-label="My resume"
                style={{ ...fabBtn(top, left), ...(open ? fabActive : null) }}
            >
                <ResumeIcon />
            </button>

            {open && (
                <div style={drawer(top + 52, left)} role="dialog" aria-label="My resume">
                    <div style={header}>
                        <span style={title}>My resume</span>
                        {resumeUrl && (
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={openLink}>
                                Open in new tab ↗
                            </a>
                        )}
                        <button type="button" onClick={() => setOpen(false)} style={closeBtn} aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>

                    <div style={body}>
                        {loading && <div style={muted}>Loading your resume…</div>}
                        {!loading && checked && !resumeUrl && (
                            <div style={muted}>
                                No resume on file yet. Upload one from your profile to view it here during calls.
                            </div>
                        )}
                        {!loading && resumeUrl && !blobUrl && !failed && (
                            <div style={muted}>Preparing preview…</div>
                        )}
                        {!loading && resumeUrl && failed && (
                            <div style={muted}>
                                Couldn't preview it inline — use "Open in new tab" above.
                            </div>
                        )}
                        {!loading && blobUrl && (
                            <iframe src={blobUrl} title="Resume preview" style={frame} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ── icons ── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ResumeIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" {...stroke}>
        <path d="M15 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l5 5v11a2 2 0 0 1-2 2Z" />
        <circle cx="10" cy="13" r="2" /><path d="M14 17c0-1.66-1.79-3-4-3s-4 1.34-4 3" />
    </svg>
);
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);

/* ── styles ── */
const fabBtn = (top, left) => ({
    position: 'fixed',
    top,
    left,
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
const fabActive = { background: '#7567C9', borderColor: '#7567C9' };
const drawer = (top, left) => ({
    position: 'fixed',
    top,
    left,
    zIndex: 1000,
    width: 'min(88vw, 360px)',
    maxHeight: 'calc(100vh - 110px)',
    borderRadius: 14,
    background: 'rgba(24,24,30,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 12px 34px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
});
const header = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px 10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
};
const title = { color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', flex: 1 };
const openLink = { color: '#a99ee0', fontSize: 11.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' };
const closeBtn = {
    width: 26, height: 26, borderRadius: 7, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
};
const body = {
    flex: 1,
    minHeight: 200,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
};
const muted = {
    margin: 'auto',
    padding: 20,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12.5,
    lineHeight: 1.5,
    textAlign: 'center',
};
const frame = { width: '100%', height: 'min(70vh, 480px)', border: 'none', background: '#fff' };
