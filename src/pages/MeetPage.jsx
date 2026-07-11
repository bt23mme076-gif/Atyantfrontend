import { LiveKitRoom, VideoConference, useConnectionState } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DisconnectReason, ConnectionState, VideoPresets } from 'livekit-client';
import BackgroundControl from '../components/meet/BackgroundControl';
import Whiteboard from '../components/meet/Whiteboard';
import SessionTimer from '../components/meet/SessionTimer';
import SessionNotes from '../components/meet/SessionNotes';
import ResumePanel from '../components/meet/ResumePanel';
import NetworkAlerts from '../components/meet/NetworkAlerts';
import AdvancedMicrophoneCheck from '../components/LiveKit/AdvancedMicrophoneCheck';
import '../components/LiveKit/MicrophoneCheck.css';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// In-call tools (session timer, network alerts, background effects, shared
// whiteboard/notes, resume panel). Rendered only once the room is connected,
// so the local camera track and data channel are ready. `hasVideo` hides
// camera-only effects on audio-only calls. Right-side tools stack below the
// timer pill; ResumePanel and NetworkAlerts don't compete for that space
// (left side / top-center respectively).
function MeetTools({ hasVideo }) {
    const state = useConnectionState();
    if (state !== ConnectionState.Connected) return null;
    return (
        <>
            <AdvancedMicrophoneCheck />
            <SessionTimer />
            <NetworkAlerts />
            <ResumePanel top={14} left={14} />
            {hasVideo && <BackgroundControl top={14} right={14} />}
            <Whiteboard top={hasVideo ? 66 : 14} right={14} />
            <SessionNotes top={hasVideo ? 118 : 66} right={14} />
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
            // adaptiveStream/dynacast reduce load on weak connections; capping capture
            // at 540p means less data has to survive a lossy WiFi hop before it stalls.
            options={{
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
            }}
            // Force ALL media through the TURN relay (TURN-over-TLS-443, verified
            // working on the LiveKit VPS). Students on Tier-2/3 college WiFi / mobile
            // data can't hold a direct (srflx) path — it connects, then drops
            // ("short ice connection"), and every reconnect recreates the room, which
            // orphans the audio egress so the recording captures only the first few
            // silent seconds (this is exactly why real sessions came out as
            // `no_audio` even though the two people could hear each other). Relaying
            // every call through the always-reachable TURN keeps the connection — and
            // the room — stable for the whole session, so egress records it end to
            // end. 'all' let ICE pick the fragile direct path; 'relay' removes it.
            // rtcConfig belongs on connectOptions, not options — RoomOptions has no
            // rtcConfig field, so it was silently dropped here before.
            connectOptions={{ rtcConfig: { iceTransportPolicy: 'relay' } }}
        >
            <VideoConference />
            <MeetTools hasVideo={roomData.callType !== 'audio'} />
        </LiveKitRoom>
    );
}