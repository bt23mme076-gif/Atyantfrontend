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
import PreCallCheck from '../components/meet/PreCallCheck';

// Feature flag: gate the pre-call network check. Flip to false (or revert this
// commit) to fully disable it and go straight from "join" to the room.
const ENABLE_PRECALL_CHECK = true;

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// In-call tools (session timer, network alerts, background effects, shared
// whiteboard/notes, resume panel). Rendered only once the room is connected,
// so the local camera track and data channel are ready. `hasVideo` hides
// camera-only effects on audio-only calls. Right-side tools stack below the
// timer pill; ResumePanel and NetworkAlerts don't compete for that space
// (left side / top-center respectively).
function MeetTools({ hasVideo, sessionId }) {
    const state = useConnectionState();
    if (state !== ConnectionState.Connected) return null;
    return (
        <>
            <AdvancedMicrophoneCheck />
            <SessionTimer />
            <NetworkAlerts />
            <ResumePanel top={14} left={14} sessionId={sessionId} />
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
    // Force all media through the TURN relay. Verified on 5G mobile data
    // (2026-07-12): forced relay gathered a relay candidate and held a stable
    // call for the full duration — mobile/CGNAT users can't connect reliably on
    // the direct (srflx) path (symmetric NAT drops them), so relay is the only
    // path that works for them every time. WiFi users are unaffected in practice
    // (the VPS is ~idle and TURN relay is just packet forwarding). The earlier
    // "dtls timeout" scare was leave/teardown noise, not mid-call failure.
    // Flip FORCE_RELAY to false to instantly disable and go back to direct ICE.
    // ?relay=0 on the URL disables it for one session (for A/B testing direct).
    const FORCE_RELAY = true;
    const relayParam = new URLSearchParams(window.location.search).get('relay');
    const forceRelay = relayParam === '0' ? false : (FORCE_RELAY || relayParam === '1');
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [needsAuth, setNeedsAuth] = useState(false);
    const [ended, setEnded] = useState(false);
    // Pre-call network check: once roomData is loaded we show the check first,
    // and only render the LiveKitRoom after the user proceeds. Skipped entirely
    // when the flag is off.
    const [netCheckPassed, setNetCheckPassed] = useState(false);

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

    // Gate: run the network check once, before connecting. onProceed flips the
    // flag so the room renders. Disabled → render the room immediately.
    if (ENABLE_PRECALL_CHECK && !netCheckPassed) {
        return (
            <PreCallCheck
                apiBase={API_BASE}
                onProceed={() => setNetCheckPassed(true)}
            />
        );
    }

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
            // Capture at 720p for a sharp (non-blurry) image. adaptiveStream +
            // dynacast + simulcast still protect weak connections automatically:
            // the SFU drops to lower layers when a viewer's network can't keep up,
            // so 720p is the ceiling on good networks, not a floor forced on bad ones.
            options={{
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
            }}
            // Relay is NOT forced by default (direct/srflx is what works for WiFi).
            // ?relay=1 forces THIS session through TURN relay — a temporary
            // diagnostic to test whether mobile/CGNAT can connect + stay stable
            // via relay. connectOptions is the correct prop (RoomOptions has no
            // rtcConfig field, which is why an earlier attempt on options was a
            // silent no-op).
            connectOptions={forceRelay ? { rtcConfig: { iceTransportPolicy: 'relay' } } : undefined}
        >
            <VideoConference />
            <MeetTools hasVideo={roomData.callType !== 'audio'} sessionId={sessionId} />
        </LiveKitRoom>
    );
}