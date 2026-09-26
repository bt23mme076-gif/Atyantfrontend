import {
  LiveKitRoom, VideoConference, useConnectionState, useLocalParticipant, useVoiceAssistant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DisconnectReason, ConnectionState, VideoPresets } from 'livekit-client';
import BackgroundControl from '../meet/BackgroundControl';
import SessionTimer from '../meet/SessionTimer';
import NetworkAlerts from '../meet/NetworkAlerts';
import PreCallCheck from '../meet/PreCallCheck';
import AdvancedMicrophoneCheck from '../LiveKit/AdvancedMicrophoneCheck';
import '../LiveKit/MicrophoneCheck.css';
import { mockInterviewAPI } from '../../api';

// The AI mock interview reuses the mentor-meet room as-is (720p camera, forced
// TURN relay for mobile/CGNAT, pre-call network check, mic check, timer,
// network alerts, background effects). Differences: the token comes from the
// mock interview API, and the other participant is the AI interviewer agent,
// whose words are shown as captions.

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// Same relay policy as MeetPage (see the note there): relay is the only path
// that works reliably for students on mobile data.
const FORCE_RELAY = true;

// What the interviewer is saying (or that it is still joining / thinking).
function InterviewerCaptions() {
  const { agent, state, agentTranscriptions } = useVoiceAssistant();
  const latest = agentTranscriptions?.[agentTranscriptions.length - 1]?.text;
  const text = !agent
    ? 'Your interviewer is joining…'
    : state === 'thinking'
      ? '…'
      : latest || (state === 'listening' ? 'Listening…' : '');
  if (!text) return null;
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 86, transform: 'translateX(-50%)', zIndex: 20,
      maxWidth: 'min(760px, 92vw)', padding: '10px 16px', borderRadius: 12,
      background: 'rgba(15, 15, 25, 0.78)', color: '#fff', fontSize: '.95rem', lineHeight: 1.45, textAlign: 'center',
      pointerEvents: 'none',
    }}>
      <span style={{ color: '#a596e0', fontWeight: 700, marginRight: 8 }}>Interviewer</span>{text}
    </div>
  );
}

// The interview is meant to feel like the real room, so the camera stays on.
function CameraReminder() {
  const { isCameraEnabled } = useLocalParticipant();
  if (isCameraEnabled) return null;
  return (
    <div style={{
      position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
      padding: '8px 14px', borderRadius: 10, background: '#FB923C', color: '#1a1a1a', fontSize: '.85rem', fontWeight: 600,
    }}>
      Turn your camera on. Real interviews are on camera, so practice that way.
    </div>
  );
}

function InterviewTools() {
  const state = useConnectionState();
  if (state !== ConnectionState.Connected) return null;
  return (
    <>
      <AdvancedMicrophoneCheck />
      <SessionTimer />
      <NetworkAlerts />
      <BackgroundControl top={14} right={14} />
      <CameraReminder />
      <InterviewerCaptions />
    </>
  );
}

function Screen({ children }) {
  return (
    <div className="meet-screen">
      <div className="meet-card">{children}</div>
    </div>
  );
}

/**
 * Full-screen interview room.
 * @param {string}   interviewId
 * @param {function} onExit  (reason: 'left' | 'ended') => void
 */
export default function MockInterviewRoom({ interviewId, onExit }) {
  const relayParam = new URLSearchParams(window.location.search).get('relay');
  const forceRelay = relayParam === '0' ? false : (FORCE_RELAY || relayParam === '1');
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);
  const [netCheckPassed, setNetCheckPassed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mockInterviewAPI.join(interviewId)
      .then(data => { if (!cancelled) setRoomData(data); })
      .catch(err => { if (!cancelled) setError(err.message || 'Could not join the interview'); });
    return () => { cancelled = true; };
  }, [interviewId]);

  let body;
  if (error) {
    body = (
      <Screen>
        <div className="meet-card-title">Can’t start the interview</div>
        <div className="meet-card-sub">{error}</div>
        <button className="meet-btn" onClick={() => onExit('left')}>Back</button>
      </Screen>
    );
  } else if (!roomData) {
    body = (
      <Screen>
        <div className="meet-spinner" />
        <div className="meet-card-title">Setting up your interview…</div>
        <div className="meet-card-sub">Getting your interviewer ready</div>
      </Screen>
    );
  } else if (!netCheckPassed) {
    body = <PreCallCheck apiBase={API_BASE} onProceed={() => setNetCheckPassed(true)} />;
  } else {
    body = (
      <LiveKitRoom
        token={roomData.token}
        serverUrl={roomData.livekitUrl}
        connect={true}
        audio={true}
        video={true}
        data-lk-theme="default"
        className="atyant-meet"
        style={{
          height: '100vh',
          '--lk-accent-bg': '#7567C9',
          '--lk-accent2': '#8474d1',
          '--lk-accent3': '#9585d9',
          '--lk-accent4': '#a596e0',
          '--lk-border-radius': '0.7rem',
        }}
        // Leave pressed → back to the interview page (it can be rejoined).
        // Room closed by the interviewer at the end, or a lost connection → 'ended'.
        onDisconnected={(reason) => onExit(reason === DisconnectReason.CLIENT_INITIATED ? 'left' : 'ended')}
        options={{
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
        }}
        connectOptions={forceRelay ? { rtcConfig: { iceTransportPolicy: 'relay' } } : undefined}
      >
        <VideoConference />
        <InterviewTools />
      </LiveKitRoom>
    );
  }

  // Portal to <body> so the room covers the app's sidebar and header, which sit in their own stacking context.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: '#0f0f19' }}>{body}</div>,
    document.body
  );
}
