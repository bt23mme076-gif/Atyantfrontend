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

    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('atyant_token');
        axios.post(`${API_BASE}/api/livekit/join/${sessionId}`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
        })
            .then(res => {
                if (!cancelled) { setRoomData(res.data); setLoading(false); }
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err?.response?.data?.error || 'Could not join session');
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
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#f87171', fontSize: 18 }}>
            {error}
        </div>
    );

    return (
        <LiveKitRoom
            token={roomData.token}
            serverUrl={roomData.livekitUrl}
            connect={true}
            audio={true}
            video={true}
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