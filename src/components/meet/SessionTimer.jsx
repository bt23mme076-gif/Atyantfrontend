import { useEffect, useMemo, useState } from 'react';
import { useParticipants } from '@livekit/components-react';

// Elapsed-time "session clock" shown to both participants during a call so the
// mentor and the user always know how long they've been talking.
//
// The start reference is the EARLIEST joinedAt across everyone in the room, so
// both sides converge on the same running total once they're both connected —
// a late joiner immediately sees how long the session has really been going,
// rather than restarting from zero. Falls back to mount time before joinedAt
// is populated, and never counts from a future timestamp (clock skew).
function format(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function SessionTimer() {
    const participants = useParticipants();
    // Stable baseline captured once at mount (lazy init → runs a single time).
    const [mountMs] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const startMs = useMemo(() => {
        const times = participants
            .map((p) => p.joinedAt?.getTime?.())
            .filter((t) => typeof t === 'number' && t > 0);
        // Clamp to mount time: min() also guards against a joinedAt reported in
        // the future (clock skew), which would otherwise show negative time.
        return times.length ? Math.min(mountMs, ...times) : mountMs;
    }, [participants, mountMs]);

    const elapsed = now - startMs;

    return (
        <div className="meet-timer" style={wrap} role="timer" aria-label="Session time">
            <span className="meet-live-dot" style={dot} />
            <span style={live}>LIVE</span>
            <span style={sep} />
            <ClockIcon />
            <span style={time}>{format(elapsed)}</span>
        </div>
    );
}

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

/* ── styles ── */
const wrap = {
    position: 'fixed',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 14px',
    borderRadius: 999,
    background: 'rgba(20,20,26,0.72)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
    userSelect: 'none',
    pointerEvents: 'none', // purely informational — never intercept clicks
};
const dot = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
    flexShrink: 0,
};
const live = { fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: '#e5e7eb' };
const sep = { width: 1, height: 14, background: 'rgba(255,255,255,0.18)' };
const time = {
    fontSize: 14,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
    color: '#fff',
    minWidth: 42,
    textAlign: 'center',
};
