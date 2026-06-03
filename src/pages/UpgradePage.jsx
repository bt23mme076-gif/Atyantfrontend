import { useState, useEffect, useRef } from "react";
import useIsMobile from "../hooks/useIsMobile";

const T = {
  bg:           "#13121A",
  sidebar:      "#0D0C12",
  card:         "#1A1823",
  cardHover:    "#211E2C",
  cardBorder:   "#322E40",
  active:       "#221E33",
  activeBorder: "#443A6B",
  accent:       "#7567C9",
  accentSoft:   "#7567C922",
  accentText:   "#8E80DB",
  text:         "#ECEAF3",
  textSub:      "#978FAB",
  textMuted:    "#5F576F",
  green:        "#3DBE82",
};

const PRICES = { starter: 199, pro: 499, elite: 999 };
const fmt = (n) => Number(n).toLocaleString("en-IN");
const yearlyPerMonth = (p) => Math.round(p * 0.8);
const yearlyTotal    = (p) => Math.round(p * 12 * 0.8);
const yearlySave     = (p) => Math.round(p * 12 * 0.2);

function Check({ green }) {
  return (
    <span style={{
      flexShrink: 0, width: 18, height: 18, borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginTop: 1, fontSize: 10, fontWeight: 700,
      background: green ? "rgba(61,190,130,0.16)" : "rgba(117,103,201,0.18)",
      color: green ? T.green : T.accentText,
    }}>✓</span>
  );
}

function Feature({ text, green }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: T.textSub, lineHeight: 1.45 }}>
      <Check green={green} />
      {text}
    </li>
  );
}

export default function UpgradePage() {
  const isMobile = useIsMobile();
  const [billing, setBillingState] = useState("monthly");
  const btnMonthlyRef = useRef(null);
  const btnYearlyRef  = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    if (btnMonthlyRef.current) {
      setSliderStyle({ width: btnMonthlyRef.current.offsetWidth, transform: "translateX(0)" });
    }
  }, []);

  const setB = (mode) => {
    setBillingState(mode);
    if (mode === "yearly" && btnYearlyRef.current) {
      setSliderStyle({ width: btnYearlyRef.current.offsetWidth, transform: `translateX(${btnMonthlyRef.current.offsetWidth}px)` });
    } else if (btnMonthlyRef.current) {
      setSliderStyle({ width: btnMonthlyRef.current.offsetWidth, transform: "translateX(0)" });
    }
  };

  const price = (plan) => billing === "yearly" ? yearlyPerMonth(PRICES[plan]) : PRICES[plan];
  const isYearly = billing === "yearly";

  const cardStyle = (featured) => ({
    background: featured ? T.active : T.card,
    border: `1px solid ${featured ? T.activeBorder : T.cardBorder}`,
    borderRadius: 22,
    padding: featured ? "46px 24px 28px" : "28px 24px 28px",
    position: "relative",
    transition: "border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s",
  });

  return (
    <div style={{ position: "relative", overflowX: "hidden", minHeight: "100%", background: T.bg }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none", zIndex: 0, opacity: 0.13, background: T.accent, top: -160, right: -80 }} />
      <div style={{ position: "fixed", width: 360, height: 360, borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none", zIndex: 0, opacity: 0.13, background: "#3A2A7C", bottom: 40, left: -100 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "60px 20px 88px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: T.accentSoft, border: `1px solid ${T.activeBorder}`, color: T.accentText, fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2.2s ease-in-out infinite" }} />
            Choose Your Plan
          </div>

          <h1 style={{ fontFamily: "'Syne', 'Satoshi', sans-serif", fontSize: "clamp(28px,5.5vw,50px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 14, color: T.text }}>
            Find connections that<br />
            <span style={{ background: "linear-gradient(130deg, #8E80DB 0%, #C4BAF5 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually mean something
            </span>
          </h1>

          <p style={{ fontSize: 15, color: T.textSub, maxWidth: 380, margin: "0 auto 32px", lineHeight: 1.65, fontWeight: 300 }}>
            Find your person, not just a match. Plans built around real connection.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", background: T.sidebar, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 4, position: "relative" }}>
            <div style={{ position: "absolute", top: 4, left: 4, height: "calc(100% - 8px)", borderRadius: 8, background: T.active, border: `1px solid ${T.activeBorder}`, transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s", zIndex: 0, width: sliderStyle.width, transform: sliderStyle.transform }} />
            <button ref={btnMonthlyRef} onClick={() => setB("monthly")}
              style={{ position: "relative", zIndex: 1, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: billing === "monthly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              Monthly
            </button>
            <button ref={btnYearlyRef} onClick={() => setB("yearly")}
              style={{ position: "relative", zIndex: 1, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: billing === "yearly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              Yearly <span style={{ display: "inline-block", background: T.green, color: "#071a0e", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 100, marginLeft: 5, verticalAlign: "middle" }}>–20%</span>
            </button>
          </div>
        </div>

        {/* ── Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 18, alignItems: "start" }}>

          {/* Starter */}
          <div style={cardStyle(false)}>
            <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16, background: "rgba(95,87,111,0.22)" }}>🌱</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textSub, marginBottom: 4 }}>Starter</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 22, lineHeight: 1.55, minHeight: 36 }}>A gentle start to finding your match.</div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: T.textSub }}>₹</span>
                <span style={{ fontSize: 40, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{fmt(price("starter"))}</span>
                {isYearly && <span style={{ fontSize: 13, color: T.textMuted, textDecoration: "line-through", marginLeft: 6 }}>{fmt(PRICES.starter)}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>{isYearly ? "per month, billed yearly" : "per month"}</div>
              {isYearly && <div style={{ fontSize: 11.5, color: T.green, marginTop: 3, fontWeight: 500 }}>Billed as ₹{fmt(yearlyTotal(PRICES.starter))}/yr — save ₹{fmt(yearlySave(PRICES.starter))}</div>}
            </div>
            <div style={{ height: 1, background: T.cardBorder, marginBottom: 20 }} />
            <ul style={{ listStyle: "none", marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              <Feature text="50 profile matches / month" />
              <Feature text="Basic compatibility insights" />
              <Feature text="Unlimited likes" />
              <Feature text="Standard support" />
            </ul>
            <button style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${T.cardBorder}`, color: T.textSub, fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.activeBorder; e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.accentSoft; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.textSub; e.currentTarget.style.background = "transparent"; }}>
              Get started
            </button>
          </div>

          {/* Pro — featured */}
          <div style={{ ...cardStyle(true), overflow: "visible" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(130deg,#7567C9,#A89EEB)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 16px", borderRadius: 100, whiteSpace: "nowrap", zIndex: 2, boxShadow: "0 4px 18px rgba(117,103,201,0.45)" }}>
              ⭐ Most Popular
            </div>
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "radial-gradient(ellipse at 50% -10%, rgba(117,103,201,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16, background: T.accentSoft }}>💜</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textSub, marginBottom: 4 }}>Pro</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 22, lineHeight: 1.55, minHeight: 36 }}>For those serious about finding the one.</div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: T.textSub }}>₹</span>
                <span style={{ fontSize: 40, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{fmt(price("pro"))}</span>
                {isYearly && <span style={{ fontSize: 13, color: T.textMuted, textDecoration: "line-through", marginLeft: 6 }}>{fmt(PRICES.pro)}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>{isYearly ? "per month, billed yearly" : "per month"}</div>
              {isYearly && <div style={{ fontSize: 11.5, color: T.green, marginTop: 3, fontWeight: 500 }}>Billed as ₹{fmt(yearlyTotal(PRICES.pro))}/yr — save ₹{fmt(yearlySave(PRICES.pro))}</div>}
            </div>
            <div style={{ height: 1, background: T.activeBorder, marginBottom: 20 }} />
            <ul style={{ listStyle: "none", marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              <Feature text="Unlimited matches" green />
              <Feature text="Advanced compatibility analysis" green />
              <Feature text="Priority profile visibility" green />
              <Feature text="See who liked you" green />
              <Feature text="Priority support" green />
            </ul>
            <button style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg,#7567C9 0%,#9B8EE8 100%)", color: "#fff", border: "none", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(117,103,201,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(117,103,201,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(117,103,201,0.35)"; e.currentTarget.style.transform = "none"; }}>
              {isYearly ? "Upgrade to Pro (Yearly)" : "Upgrade to Pro"}
            </button>
          </div>

          {/* Elite */}
          <div style={cardStyle(false)}>
            <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16, background: "rgba(61,190,130,0.14)" }}>🚀</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textSub, marginBottom: 4 }}>Elite</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 22, lineHeight: 1.55, minHeight: 36 }}>Everything you need — nothing held back.</div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: T.textSub }}>₹</span>
                <span style={{ fontSize: 40, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{fmt(price("elite"))}</span>
                {isYearly && <span style={{ fontSize: 13, color: T.textMuted, textDecoration: "line-through", marginLeft: 6 }}>{fmt(PRICES.elite)}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>{isYearly ? "per month, billed yearly" : "per month"}</div>
              {isYearly && <div style={{ fontSize: 11.5, color: T.green, marginTop: 3, fontWeight: 500 }}>Billed as ₹{fmt(yearlyTotal(PRICES.elite))}/yr — save ₹{fmt(yearlySave(PRICES.elite))}</div>}
            </div>
            <div style={{ height: 1, background: T.cardBorder, marginBottom: 20 }} />
            <ul style={{ listStyle: "none", marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              <Feature text="Everything in Pro" green />
              <Feature text="AI deep compatibility reports" green />
              <Feature text="Profile boost every week" green />
              <Feature text="Exclusive filters" green />
              <Feature text="VIP support" green />
            </ul>
            <button style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "rgba(61,190,130,0.1)", border: `1px solid rgba(61,190,130,0.28)`, color: T.green, fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(61,190,130,0.18)"; e.currentTarget.style.borderColor = T.green; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(61,190,130,0.1)"; e.currentTarget.style.borderColor = "rgba(61,190,130,0.28)"; e.currentTarget.style.transform = "none"; }}>
              {isYearly ? "Upgrade to Elite (Yearly)" : "Upgrade to Elite"}
            </button>
          </div>
        </div>

        {/* ── Compare Table ── */}
        <div style={{ marginTop: 64, overflowX: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted, textAlign: "center", marginBottom: 24 }}>Full comparison</div>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Feature","Starter","Pro","Elite"].map((h, i) => (
                  <th key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, padding: "10px 14px", textAlign: i === 0 ? "left" : "center", borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { section: "Matching" },
                { label: "Profile matches",     cols: ["50 / month", "Unlimited", "Unlimited"],   types: ["val","green","green"] },
                { label: "Unlimited likes",      cols: ["✓","✓","✓"],                              types: ["yes","green","green"] },
                { label: "See who liked you",    cols: ["—","✓","✓"],                              types: ["no","green","green"] },
                { label: "Exclusive filters",    cols: ["—","—","✓"],                              types: ["no","no","green"] },
                { section: "Compatibility" },
                { label: "Basic insights",       cols: ["✓","✓","✓"],                              types: ["yes","green","green"] },
                { label: "Advanced analysis",    cols: ["—","✓","✓"],                              types: ["no","green","green"] },
                { label: "AI deep reports",      cols: ["—","—","✓"],                              types: ["no","no","green"] },
                { section: "Visibility" },
                { label: "Priority visibility",  cols: ["—","✓","✓"],                              types: ["no","green","green"] },
                { label: "Weekly profile boost", cols: ["—","—","Every week"],                     types: ["no","no","green"] },
                { section: "Support" },
                { label: "Support level",        cols: ["Standard","Priority","VIP"],              types: ["no","yes","green"] },
              ].map((row, i) => {
                if (row.section) return (
                  <tr key={i}>
                    <td colSpan={4} style={{ paddingTop: 22, paddingBottom: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted, borderBottom: "none", padding: "22px 14px 4px" }}>{row.section}</td>
                  </tr>
                );
                const colColor = (t) => t === "green" ? T.green : t === "yes" ? T.accentText : t === "val" ? T.text : T.textMuted;
                return (
                  <tr key={i}>
                    <td style={{ padding: "12px 14px", color: T.text, textAlign: "left", borderBottom: `1px solid rgba(50,46,64,0.35)` }}>{row.label}</td>
                    {row.cols.map((v, j) => (
                      <td key={j} style={{ padding: "12px 14px", textAlign: "center", color: colColor(row.types[j]), fontWeight: row.types[j] === "val" ? 500 : 400, borderBottom: `1px solid rgba(50,46,64,0.35)` }}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, color: T.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>
          Prices in INR. Cancel anytime — no questions asked.<br />
          Need help choosing? <span style={{ color: T.accentText, cursor: "pointer" }}>Chat with us</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.65); }
        }
      `}</style>
    </div>
  );
}
