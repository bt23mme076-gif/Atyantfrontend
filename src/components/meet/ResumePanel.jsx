import { useEffect, useState } from 'react';
import { livekitAPI } from '../../api';

// Shows the STUDENT's resume during the call — for both the student and the
// mentor of that session, via GET /api/livekit/session/:sessionId/resume
// (backend checks the requester is one of the two session participants).
//
// The iframe points straight at the Cloudinary URL — allowed because
// vercel.json's CSP frame-src explicitly whitelists res.cloudinary.com.

export default function ResumePanel({ top = 14, left = 14, sessionId }) {
    const [open, setOpen] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [checked, setChecked] = useState(false);
    const loading = open && !checked;

    // Fetch lazily — only once the panel is opened the first time.
    useEffect(() => {
        if (!open || checked || !sessionId) return;
        livekitAPI.resume(sessionId)
            .then((res) => setResumeUrl(res.resumeUrl || null))
            .catch(() => setResumeUrl(null))
            .finally(() => setChecked(true));
    }, [open, checked, sessionId]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="Student's resume"
                aria-label="Student's resume"
                style={{ ...fabBtn(top, left), ...(open ? fabActive : null) }}
            >
                <ResumeIcon />
            </button>

            {open && (
                <div style={drawer(top + 52, left)} role="dialog" aria-label="Student's resume">
                    <div style={header}>
                        <span style={title}>Student's resume</span>
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
                        {loading && <div style={muted}>Loading resume…</div>}
                        {!loading && checked && !resumeUrl && (
                            <div style={muted}>
                                No resume on file for this student yet.
                            </div>
                        )}
                        {!loading && resumeUrl && (
                            <iframe src={resumeUrl} title="Resume preview" style={frame} />
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
