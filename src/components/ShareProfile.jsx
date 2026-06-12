import { useState } from "react";
import { Link2, X, Check } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const getToken = () => localStorage.getItem("atyant_token");

const T = {
  bg:          "#13121A",
  card:        "#1A1823",
  cardBorder:  "#322E40",
  active:      "#221E33",
  activeBorder:"#443A6B",
  accent:      "#7567C9",
  accentSoft:  "#7567C922",
  accentText:  "#8E80DB",
  text:        "#ECEAF3",
  textSub:     "#978FAB",
  textMuted:   "#5F576F",
};

const PLATFORMS = [
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "#000",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#0088cc",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    color: "#EA4335",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
];

export default function ShareProfile() {
  const [open,    setOpen]    = useState(false);
  const [kit,     setKit]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState("");

  const loadKit = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/share/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load share links");
      setKit(data.share);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    if (!kit) await loadKit();
  };

  const track = (via) => {
    fetch(`${API_BASE}/api/share/me/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ via }),
    }).catch(() => {});
  };

  const shareTo = (platform) => {
    if (!kit) return;
    track(platform);
    window.open(kit.platforms[platform], "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    if (!kit) return;
    await navigator.clipboard.writeText(kit.trackedUrl);
    track("copy");
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const nativeShare = async () => {
    if (!kit || !navigator.share) return;
    try {
      await navigator.share({ title: kit.meta?.title, text: kit.shareText, url: kit.trackedUrl });
      track("copy");
    } catch { /* user cancelled */ }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openPanel}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: T.active, border: `1px solid ${T.activeBorder}`,
          borderRadius: 9, padding: "8px 14px",
          color: T.accentText, fontSize: "0.82rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.accentSoft; e.currentTarget.style.borderColor = T.accent; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.active; e.currentTarget.style.borderColor = T.activeBorder; }}
      >
        <Link2 size={14} />
        Share profile
      </button>

      {/* Overlay + panel */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: "1.5rem", width: "90%", maxWidth: 420, position: "relative" }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: T.text, margin: 0 }}>Share your Atyant profile</h3>
                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Every share is tracked — see who found you through your link.</p>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ background: T.active, border: `1px solid ${T.cardBorder}`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSub, flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            {loading && (
              <p style={{ textAlign: "center", color: T.textMuted, fontSize: 13, padding: "1rem 0" }}>Loading share links…</p>
            )}
            {error && (
              <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            {kit && (
              <>
                {/* Share text preview */}
                {kit.shareText && (
                  <div style={{ background: T.active, border: `1px solid ${T.activeBorder}`, borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem", fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
                    {kit.shareText}
                  </div>
                )}

                {/* Platform buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: "1.25rem" }}>
                  {PLATFORMS.map((p) => (
                    <button key={p.id} onClick={() => shareTo(p.id)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "12px 8px", border: `1px solid ${T.cardBorder}`, borderRadius: 10, background: T.active, color: T.textSub, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.color = p.color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.textSub; }}
                    >
                      <span style={{ color: p.color }}>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Copy link row */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    readOnly
                    value={kit.trackedUrl}
                    onFocus={e => e.target.select()}
                    style={{ flex: 1, background: T.active, border: `1px solid ${T.cardBorder}`, borderRadius: 9, padding: "9px 12px", color: T.textSub, fontSize: 12, outline: "none", fontFamily: "inherit", minWidth: 0 }}
                  />
                  <button onClick={copyLink}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", background: copied ? "#3DBE82" : T.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {copied ? <><Check size={13} /> Copied!</> : <><Link2 size={13} /> Copy link</>}
                  </button>
                </div>

                {/* Native share (mobile) */}
                {typeof navigator !== "undefined" && navigator.share && (
                  <button onClick={nativeShare}
                    style={{ marginTop: 10, width: "100%", padding: "10px", borderRadius: 9, border: `1px solid ${T.cardBorder}`, background: "transparent", color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    More options…
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
