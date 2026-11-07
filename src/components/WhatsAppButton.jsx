import { useEffect, useState } from "react";
import { X } from "lucide-react";

const WA_NUMBER = "919579040183";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Atyant")}`;
const HINT_KEY = "atyant_wa_hint_seen";

const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function WhatsAppGlyph({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="#fff">
      <path d="M16.004 3C8.82 3 3 8.82 3 16.002c0 2.293.6 4.53 1.74 6.505L3 29l6.66-1.746A12.96 12.96 0 0 0 16.004 29C23.184 29 29 23.18 29 16.002 29 8.82 23.184 3 16.004 3Zm0 23.64c-2.02 0-4-.543-5.727-1.57l-.41-.244-3.953 1.036 1.055-3.853-.267-.396A10.6 10.6 0 0 1 5.36 16c0-5.868 4.776-10.64 10.648-10.64 5.868 0 10.636 4.772 10.636 10.64 0 5.872-4.772 10.64-10.64 10.64Zm5.834-7.966c-.32-.16-1.89-.932-2.184-1.04-.293-.106-.506-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.896-1.78-2.216-.186-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.106-.213.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.094-1.12 2.668 0 1.574 1.146 3.094 1.306 3.307.16.213 2.256 3.444 5.466 4.83.764.33 1.36.527 1.825.674.767.244 1.465.21 2.017.127.615-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373Z" />
    </svg>
  );
}

// Floating "chat on WhatsApp" entry point. `hidden` lets the app shell keep it
// off screens with their own bottom controls (chat composer, live interview).
export default function WhatsAppButton({ hidden = false }) {
  const [hint, setHint] = useState(false);
  const [hover, setHover] = useState(false);

  // One gentle nudge per visitor, a few seconds after they land.
  useEffect(() => {
    if (hidden || storage.get(HINT_KEY)) return;
    const t = setTimeout(() => setHint(true), 4000);
    return () => clearTimeout(t);
  }, [hidden]);

  const dismissHint = () => { setHint(false); storage.set(HINT_KEY, "1"); };

  if (hidden) return null;

  return (
    <div className="atyant-wa-root">
      {hint && (
        <div className="atyant-wa-hint" role="status">
          <button className="atyant-wa-hint-close" onClick={dismissHint} aria-label="Dismiss">
            <X size={14} />
          </button>
          <div className="atyant-wa-hint-title">Atyant is on WhatsApp 🎉</div>
          <div className="atyant-wa-hint-body">
            Ask your placement or internship doubt and get guidance from seniors, right in your chats.
          </div>
          <a className="atyant-wa-hint-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={dismissHint}>
            Say hi on WhatsApp →
          </a>
        </div>
      )}

      <a
        className={`atyant-wa-btn${hover ? " is-open" : ""}`}
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Atyant on WhatsApp"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={dismissHint}
      >
        <span className="atyant-wa-pulse" aria-hidden="true" />
        <span className="atyant-wa-icon"><WhatsAppGlyph /></span>
        <span className="atyant-wa-label">Chat with seniors</span>
      </a>

      <style>{`
        .atyant-wa-root {
          position: fixed;
          right: max(20px, env(safe-area-inset-right));
          bottom: max(20px, env(safe-area-inset-bottom));
          z-index: 900;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          font-family: var(--font-body, inherit);
        }
        .atyant-wa-btn {
          position: relative;
          display: flex;
          align-items: center;
          height: 58px;
          min-width: 58px;
          padding: 0 15px;
          border-radius: 999px;
          background: linear-gradient(135deg, #2BE372 0%, #25D366 45%, #128C7E 100%);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(18, 140, 126, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12);
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s ease;
          box-sizing: border-box;
        }
        .atyant-wa-btn:hover, .atyant-wa-btn:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(18, 140, 126, 0.45), 0 3px 8px rgba(0, 0, 0, 0.15);
          outline: none;
        }
        .atyant-wa-btn:focus-visible { box-shadow: 0 0 0 3px #fff, 0 0 0 5px #25D366; }
        .atyant-wa-icon { display: inline-flex; flex-shrink: 0; position: relative; z-index: 1; }
        .atyant-wa-label {
          position: relative;
          z-index: 1;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          font-weight: 600;
          font-size: 0.92rem;
          letter-spacing: 0.01em;
          opacity: 0;
          transition: max-width 0.35s cubic-bezier(.2,.8,.2,1), opacity 0.2s ease, margin 0.35s ease;
        }
        .atyant-wa-btn.is-open .atyant-wa-label { max-width: 180px; opacity: 1; margin-left: 10px; }
        .atyant-wa-pulse {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: #25D366;
          animation: atyant-wa-pulse 2.6s ease-out infinite;
          z-index: 0;
        }
        @keyframes atyant-wa-pulse {
          0% { transform: scale(1); opacity: 0.45; }
          70%, 100% { transform: scale(1.45); opacity: 0; }
        }

        .atyant-wa-hint {
          position: relative;
          width: min(290px, calc(100vw - 40px));
          box-sizing: border-box;
          padding: 16px 16px 14px;
          border-radius: 16px;
          background: var(--c-card, #fff);
          color: var(--c-text, #1B1830);
          border: 1px solid rgba(37, 211, 102, 0.35);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
          animation: atyant-wa-in 0.4s cubic-bezier(.2,.8,.2,1);
        }
        .atyant-wa-hint::after {
          content: "";
          position: absolute;
          right: 22px;
          bottom: -7px;
          width: 12px;
          height: 12px;
          background: inherit;
          border-right: 1px solid rgba(37, 211, 102, 0.35);
          border-bottom: 1px solid rgba(37, 211, 102, 0.35);
          transform: rotate(45deg);
        }
        .atyant-wa-hint-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; padding-right: 20px; }
        .atyant-wa-hint-body { font-size: 0.84rem; line-height: 1.45; opacity: 0.8; margin-bottom: 10px; }
        .atyant-wa-hint-cta {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #128C7E;
          text-decoration: none;
        }
        .dark .atyant-wa-hint-cta { color: #3EE07F; }
        .atyant-wa-hint-cta:hover { text-decoration: underline; }
        .atyant-wa-hint-close {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          padding: 4px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          opacity: 0.55;
          cursor: pointer;
        }
        .atyant-wa-hint-close:hover { opacity: 1; background: rgba(127, 127, 127, 0.15); }
        @keyframes atyant-wa-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }

        @media (max-width: 767px) {
          .atyant-wa-root { right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); }
          .atyant-wa-btn { height: 54px; min-width: 54px; padding: 0 13px; }
          .atyant-wa-btn.is-open .atyant-wa-label { max-width: 0; opacity: 0; margin-left: 0; }
        }
        /* Jobs page founder video: sit above the minimized bubble, step aside while it plays */
        body:has(.atyant-video-bubble) .atyant-wa-root {
          right: clamp(12px, 2vw, 24px);
          bottom: calc(clamp(12px, 2vw, 24px) + env(safe-area-inset-bottom) + min(180px, 34vw) + 14px);
        }
        body:has(.atyant-video-panel) .atyant-wa-root { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .atyant-wa-pulse { animation: none; opacity: 0; }
          .atyant-wa-btn, .atyant-wa-label, .atyant-wa-hint { transition: none; animation: none; }
        }
      `}</style>
    </div>
  );
}
