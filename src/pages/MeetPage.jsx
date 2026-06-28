import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DisconnectReason } from 'livekit-client';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export default function MeetPage({ sessionId: propSessionId }) {
    const { sessionId: paramSessionId } = useParams();
    const sessionId = propSessionId || paramSessionId;
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [needsAuth, setNeedsAuth] = useState(false);

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

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', fontSize: 18 }}>
            Joining session...
        </div>
    );

    if (error) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', justifyContent: 'center', background: '#111', color: '#f87171', fontSize: 18, padding: 24, textAlign: 'center' }}>
            {error}
            {needsAuth && (
                <button
                    onClick={() => { window.location.href = `/?redirect=${encodeURIComponent(`/?meet=${sessionId}`)}`; }}
                    style={{ background: '#7567C9', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                    Sign in to join
                </button>
            )}
        </div>
    );

    return (
        <LiveKitRoom
            token={roomData.token}
            serverUrl={roomData.livekitUrl}
            connect={true}
            audio={true}
            video={roomData.callType !== 'audio'}
            data-lk-theme="default"
            style={{ height: '100vh' }}
            onDisconnected={(reason) => {
                if (reason === DisconnectReason.CLIENT_INITIATED) navigate('/');
            }}
            options={{ rtcConfig: { iceTransportPolicy: 'all' } }}
        >
            <VideoConference />
        </LiveKitRoom>
    );
}