import { LiveKitRoom, VideoConference, useConnectionState } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DisconnectReason, ConnectionState } from 'livekit-client';
import BackgroundControl from '../components/meet/BackgroundControl';
import Whiteboard from '../components/meet/Whiteboard';
import SessionTimer from '../components/meet/SessionTimer';
import ResumePanel from '../components/meet/ResumePanel';
import NetworkAlerts from '../components/meet/NetworkAlerts';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// In-call tools (session timer, network alerts, background effects, the
// whiteboard/notes dock, resume panel). Rendered only once the room is
// connected, so the local camera track and data channel are ready. `hasVideo`
// hides camera-only effects on audio-only calls.
//
// Whiteboard is docked as a real flex sibling of the video pane (see
// .meet-board-dock in index.css) rather than an overlay, so opening it
// actually shrinks the video area instead of covering it. Its open state is
// lifted up here (not owned internally) purely so BackgroundControl — which
// is also anchored top-right — can get out of the way while the dock is open;
// everything else about the board (mode, size, drawing/notes content) stays
// fully encapsulated inside Whiteboard itself.
function MeetTools({ hasVideo }) {
    const state = useConnectionState();
    const [boardOpen, setBoardOpen] = useState(false);
    if (state !== ConnectionState.Connected) return null;
    return (
        <>
            <SessionTimer />
            <NetworkAlerts />
            <ResumePanel top={14} left={14} />
            {hasVideo && !boardOpen && <BackgroundControl top={14} right={14} />}
            <Whiteboard open={boardOpen} onOpenChange={setBoardOpen} top={14} right={14} />
        </>
    );
}

// Branded full-screen shell for the pre/post-call states (joining, error,
// ended). Keeps the loading, error and ended views visually consistent with
// the rest of the product instead of bare dark screens.
function MeetScreen({ children }) {
    return (
        <div className="meet-screen">
            <div className="meet-card">{children}</div>
        </div>
    );
}

const WarnIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
);

const LeaveIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
    </svg>
);

export default function MeetPage({ sessionId: propSessionId }) {
    const { sessionId: paramSessionId } = useParams();
    const sessionId = propSessionId || paramSessionId;
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [needsAuth, setNeedsAuth] = useState(false);
    const [ended, setEnded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('atyant_token');
        // No token at all → don't even hit the API; ask the user to sign in.
        if (!token) {
            setNeedsAuth(true);
            setError('Please sign in to join this session.');
            setLoading(false);
            return;
        }
        axios.post(`${API_BASE}/api/livekit/join/${sessionId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
        })
            .then(res => {
                if (!cancelled) { setRoomData(res.data); setLoading(false); }
            })
            .catch(err => {
                if (!cancelled) {
                    const status = err?.response?.status;
                    const data = err?.response?.data || {};
                    // A 401 means the stored token is missing/expired/invalid for this
                    // backend — surface a clear re-login prompt instead of a dead end.
                    if (status === 401) {
                        setNeedsAuth(true);
                        setError('Your session has expired. Please sign in again to join.');
                    } else {
                        setError(data.error || data.message || 'Could not join session');
                    }
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [sessionId]);

    if (ended) return (
        <MeetScreen>
            <div className="meet-badge meet-badge-neutral"><LeaveIcon /></div>
            <div className="meet-card-title">Session ended</div>
            <div className="meet-card-sub">The session has ended or the connection was lost.</div>
            <button className="meet-btn" onClick={() => navigate('/')}>Back to home</button>
        </MeetScreen>
    );

    if (loading) return (
        <MeetScreen>
            <div className="meet-spinner" />
            <div className="meet-card-title">Joining your session…</div>
            <div className="meet-card-sub">Setting up secure audio &amp; video</div>
        </MeetScreen>
    );

    if (error) return (
        <MeetScreen>
            <div className="meet-badge meet-badge-warn"><WarnIcon /></div>
            <div className="meet-card-title">{needsAuth ? 'Sign in to continue' : 'Can’t join the session'}</div>
            <div className="meet-card-sub">{error}</div>
            {needsAuth && (
                <button
                    className="meet-btn"
                    onClick={() => { window.location.href = `/atyantEngine/?redirect=${encodeURIComponent(`/atyantEngine/?meet=${sessionId}`)}`; }}
                >
                    Sign in to join
                </button>
            )}
        </MeetScreen>
    );

    return (
        <LiveKitRoom
            token={roomData.token}
            serverUrl={roomData.livekitUrl}
            connect={true}
            audio={true}
            video={roomData.callType !== 'audio'}
            data-lk-theme="default"
            className="atyant-meet"
            // Rebrand LiveKit's default (blue) accent to Atyant purple. Set as
            // inline CSS custom properties so they cascade to every LiveKit
            // child and can't be lost to stylesheet import-order/specificity.
            style={{
                height: '100vh',
                '--lk-accent-bg': '#7567C9',
                '--lk-accent2': '#8474d1',
                '--lk-accent3': '#9585d9',
                '--lk-accent4': '#a596e0',
                '--lk-border-radius': '0.7rem',
            }}
            onDisconnected={(reason) => {
                // CLIENT_INITIATED = the user pressed Leave → straight home.
                // Any other reason (lost/failed connection) → show a clear exit
                // screen instead of stranding them on a dead "Disconnected" overlay.
                if (reason === DisconnectReason.CLIENT_INITIATED) navigate('/');
                else setEnded(true);
            }}
            options={{ rtcConfig: { iceTransportPolicy: 'all' } }}
        >
            <div className="meet-room-flex">
                <div className="meet-video-pane">
                    <VideoConference />
                </div>
                <MeetTools hasVideo={roomData.callType !== 'audio'} />
            </div>
        </LiveKitRoom>
    );
}