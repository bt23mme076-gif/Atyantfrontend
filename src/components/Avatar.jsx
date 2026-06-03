import { API_URL } from "../api";

/**
 * Site-wide avatar with the chat-page image pipeline:
 *   real profilePicture  →  ui-avatars.com generated avatar (from name)  →  onError fallback
 *
 * Props:
 *   src   - profilePicture URL (http, or "/uploads/..." relative to the API)
 *   name  - person's name (used for the generated avatar + alt)
 *   size  - px diameter (default 40)
 *   bg    - hex (no #) background for the generated avatar
 */
export default function Avatar({ src, name = "User", size = 40, bg = "6366f1", style = {}, className = "" }) {
  const first = String(name || "User").trim().split(/\s+/)[0] || "User";
  const fallback =
    `https://ui-avatars.com/api/?name=${encodeURIComponent(first)}` +
    `&background=${bg}&color=fff&size=${Math.max(size * 2, 96)}&length=1&bold=true`;

  const resolved = src
    ? (src.startsWith("http") ? src : src.startsWith("/uploads") ? `${API_URL}${src}` : src)
    : fallback;

  return (
    <img
      src={resolved}
      alt={name}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        background: `#${bg}`,
        flexShrink: 0,
        display: "block",
        ...style,
      }}
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
    />
  );
}
