import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTrackVolume, useVoiceAssistant } from '@livekit/components-react';
import './InterviewerAvatar.css';

// The AI interviewer publishes audio only, so its tile would be a grey
// placeholder. This draws a 2D interviewer into that tile instead: the mouth
// follows the voice volume, the eyes blink, and a label shows what it is doing.

const TILE = '.lk-participant-tile[data-lk-local-participant="false"]';

const LABELS = { speaking: 'Speaking', listening: 'Listening', thinking: 'Thinking' };

// The agent's tile is created and re-created by VideoConference; follow it.
function useAgentTile() {
  const [tile, setTile] = useState(null);
  useEffect(() => {
    const find = () => setTile(prev => {
      const el = document.querySelector(TILE);
      return el === prev ? prev : el;
    });
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return tile;
}

function Face({ state, volume }) {
  const speaking = state === 'speaking';
  // Volume is 0..1 and rarely above ~0.4 for speech; open the mouth in proportion.
  const open = speaking ? Math.min(1, volume * 3.2) : 0;
  return (
    <svg className={`ia-face${speaking ? ' ia-talking' : ''}`} viewBox="0 0 200 220" aria-hidden="true">
      <defs>
        <linearGradient id="ia-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3470" />
          <stop offset="1" stopColor="#262149" />
        </linearGradient>
      </defs>
      {/* shoulders */}
      <path d="M22 220 C26 170 60 152 100 152 C140 152 174 170 178 220 Z" fill="url(#ia-suit)" />
      <path d="M86 152 L100 190 L114 152 Z" fill="#f4f1ff" />
      <path d="M97 160 L100 196 L103 160 Z" fill="#7567C9" />
      {/* neck */}
      <rect x="88" y="128" width="24" height="28" rx="8" fill="#c98b64" />
      <g className="ia-head">
        {/* head and hair */}
        <ellipse cx="100" cy="92" rx="46" ry="52" fill="#dca07a" />
        <path d="M54 88 C52 48 78 32 102 32 C130 32 150 50 147 86 C140 66 124 58 100 58 C78 58 62 66 54 88 Z" fill="#2b2230" />
        <ellipse cx="54" cy="96" rx="6" ry="10" fill="#d0946f" />
        <ellipse cx="146" cy="96" rx="6" ry="10" fill="#d0946f" />
        {/* brows */}
        <path d="M70 78 Q80 73 90 77" stroke="#2b2230" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M110 77 Q120 73 130 78" stroke="#2b2230" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* eyes — each in its own group so blink anchors to each eye individually */}
        <g className="ia-eye ia-eye-l">
          <ellipse cx="80" cy="92" rx="5" ry="5.5" fill="#241d2b" />
          <circle cx="81.6" cy="90.4" r="1.4" fill="#fff" />
        </g>
        <g className="ia-eye ia-eye-r">
          <ellipse cx="120" cy="92" rx="5" ry="5.5" fill="#241d2b" />
          <circle cx="121.6" cy="90.4" r="1.4" fill="#fff" />
        </g>
        {/* nose */}
        <path d="M100 96 Q96 110 101 113" stroke="#b97f5c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* mouth: a closed smile at rest, opening with the voice */}
        {open > 0.05 ? (
          <ellipse cx="100" cy="126" rx={10 + open * 3} ry={2 + open * 8} fill="#6b2b35" />
        ) : (
          <path d="M88 124 Q100 131 112 124" stroke="#8a3c46" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

export default function InterviewerAvatar() {
  const { agent, state, audioTrack } = useVoiceAssistant();
  const volume = useTrackVolume(audioTrack);
  const tile = useAgentTile();
  if (!tile || !agent) return null;

  return createPortal(
    <div className={`ia-stage ia-${state}`}>
      <div className="ia-ring">
        <Face state={state} volume={volume} />
      </div>
      <div className="ia-name">Interviewer</div>
      {LABELS[state] && (
        <div className="ia-status">
          <span className="ia-dot" />{LABELS[state]}
          {state === 'thinking' && <span className="ia-dots"><i /><i /><i /></span>}
        </div>
      )}
    </div>,
    tile
  );
}
