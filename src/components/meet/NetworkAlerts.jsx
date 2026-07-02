import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectionQualityIndicator, useParticipants } from '@livekit/components-react';
import { ConnectionQuality } from 'livekit-client';

// Tiny pop-up toasts that name-and-shame whichever side's connection is
// struggling — "Rohit's connection is unstable" — instead of a generic
// spinner both people have to guess about. Purely event-driven: each watcher
// subscribes to ONE participant's own connectionQualityChanged event via
// LiveKit's own hook, so nothing here polls or touches the video pipeline —
// it can't add lag to the call itself.
const AUTO_DISMISS_MS = 4500;

function isDegraded(q) {
    return q === ConnectionQuality.Poor || q === ConnectionQuality.Lost;
}

// Renders nothing — just watches one participant and reports transitions
// in/out of a degraded state up to the parent.
function QualityWatcher({ participant, onTransition }) {
    const { quality } = useConnectionQualityIndicator({ participant });
    const prevRef = useRef(quality);

    useEffect(() => {
        const prev = prevRef.current;
        if (quality !== prev) {
            const wasDegraded = isDegraded(prev);
            const nowDegraded = isDegraded(quality);
            // Only surface real transitions: entering a poor/lost state, or
            // recovering FROM one — not every minor Excellent<->Good flicker.
            if (nowDegraded && !wasDegraded) {
                onTransition(participant, 'degraded');
            } else if (!nowDegraded && wasDegraded) {
                onTransition(participant, 'recovered');
            }
            prevRef.current = quality;
        }
    }, [quality, participant, onTransition]);

    return null;
}

export default function NetworkAlerts() {
    const participants = useParticipants();
    const [toasts, setToasts] = useState([]); // [{ id, name, kind }]
    const timersRef = useRef({});

    const handleTransition = useCallback((participant, kind) => {
        const id = participant.identity;
        const name = participant.isLocal ? 'Your' : `${participant.name || 'Their'}'s`;
        setToasts((list) => [...list.filter((t) => t.id !== id), { id, name, kind, key: Date.now() }]);

        clearTimeout(timersRef.current[id]);
        timersRef.current[id] = setTimeout(() => {
            setToasts((list) => list.filter((t) => t.id !== id));
        }, AUTO_DISMISS_MS);
    }, []);

    useEffect(() => {
        const timers = timersRef.current;
        return () => Object.values(timers).forEach(clearTimeout);
    }, []);

    return (
        <>
            {participants.map((p) => (
                <QualityWatcher key={p.identity} participant={p} onTransition={handleTransition} />
            ))}
            {toasts.length > 0 && (
                <div style={stack} aria-live="polite">
                    {toasts.map((t) => (
                        <div key={t.key} style={{ ...toast, ...(t.kind === 'degraded' ? toastWarn : toastOk) }}>
                            {t.kind === 'degraded' ? <PoorIcon /> : <OkIcon />}
                            <span>
                                {t.name} connection {t.kind === 'degraded' ? 'is unstable' : 'has recovered'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ── icons ── */
const PoorIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" />
        <path d="M17 20V6" /><path d="m3 3 18 18" />
    </svg>
);
const OkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V6" />
    </svg>
);

/* ── styles ── */
const stack = {
    position: 'fixed',
    top: 62,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'none',
};
const toast = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 600,
    color: '#fff',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.14)',
    animation: 'meetTimerIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
};
const toastWarn = { background: 'rgba(120, 53, 15, 0.82)', color: '#fed7aa' };
const toastOk = { background: 'rgba(20, 83, 45, 0.82)', color: '#bbf7d0' };
