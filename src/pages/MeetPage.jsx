import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default function MeetPage() {
    const { sessionId } = useParams();
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('atyant_token');
        axios.post(`${API_BASE}/api/livekit/join/${sessionId}`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
        })
            .then(res => setRoomData(res.data))
            .catch(() => setError('Could not join session'));
    }, [sessionId]);

    if (error) return <div>{error}</div>;
    if (!roomData) return <div>Joining session...</div>;

    return (
        <LiveKitRoom
            token={roomData.token}
            serverUrl={roomData.livekitUrl}
            connect={true}
            audio={true}
            video={true}
            style={{ height: '100vh' }}
        >
            <VideoConference />
        </LiveKitRoom>
    );
}