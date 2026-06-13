import { useState, useEffect, useRef } from "react";
import { Compass, Target, Rocket } from "lucide-react";
import { purchaseSubscription } from "../lib/subscriptionCheckout";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

// Theme-aware palette (maps to CSS vars in index.css for light + dark).
const T = {
  bg:          "var(--c-bg)",
  sidebar:     "var(--c-sidebar)",
  card:        "var(--c-card)",
  cardHover:   "var(--c-cardHover)",
  cardBorder:  "var(--c-cardBorder)",
  active:      "var(--c-active)",
  activeBorder:"var(--c-activeBorder)",
  accent:      "#7567C9",
  accentSoft:  "var(--c-accentSoft)",
  accentText:  "var(--c-accentText)",
  text:        "var(--c-text)",
  textSub:     "var(--c-textSub)",
  textMuted:   "var(--c-textMuted)",
  green:       "#3DBE82",
};

const STUDENT_PLANS = [
  {
    key: "free", name: "Explorer", Icon: Compass,
    monthly: 0, yearly: 0, featured: false,
    tagline: "Start with clarity", cta: "Start Free", ctaStyle: "outline",
    features: [
      { text: "3 AnswerCards per search", green: false },
      { text: "See matched seniors (names only)", green: false },
      { text: "Unlimited landing chat questions", green: false },
      { text: "Basic college path data", green: false },
    ],
  },
  {
    key: "clarity", name: "Clarity", Icon: Target,
    monthly: 299, yearly: 239, featured: true,
    tagline: "For placement season", cta: "Get Clarity", ctaStyle: "accent",
    features: [
      { text: "Unlimited AnswerCards", green: true },
      { text: "Full senior profiles + journeys", green: true },
      { text: "1 session credit / month (₹299 value)", green: true },
      { text: "Journey tracker dashboard", green: true },
      { text: "Priority senior matching (4hr response)", green: true },
      { text: "Session notes & recordings", green: true },
    ],
  },
  {
    key: "pro", name: "Pro", Icon: Rocket,
    monthly: 699, yearly: 559, featured: false,
    tagline: "Serious placement prep", cta: "Go Pro", ctaStyle: "green",
    features: [
      { text: "Everything in Clarity", green: true },
      { text: "3 session credits / month (₹900 value)", green: true },
      { text: "Mock interview prep cards", green: true },
      { text: "Resume review by verified senior", green: true },
      { text: "Outcome tracking + placement report", green: true },
      { text: "WhatsApp senior connect", green: true },
    ],
  },
];

const B2B_PLANS = [
  {
    key: "campus_lite", name: "Campus Lite", price: "₹75,000", period: "/year",
    tagline: "For small colleges upto 500 students", cta: "Request Demo", featured: false,
    features: [
      "Up to 500 student accounts",
      "Anonymized placement funnel dashboard",
      "Monthly clarity report for TPO",
      "Atyant branding in college portal",
      "Email support",
    ],
  },
  {
    key: "campus_pro", name: "Campus Pro", price: "₹1,50,000", period: "/year",
    tagline: "For mid-size institutes upto 2000 students", cta: "Request Demo", featured: true,
    features: [
      "Up to 2,000 student accounts",
      "Real-time student journey analytics",
      "Dedicated senior pool for your college",
      "Placement outcome tracking",
      "TPO dashboard + data exports",
      "2 live workshops per year",
      "Priority support",
    ],
  },
  {
    key: "campus_enterprise", name: "Enterprise", price: "₹3,00,000", period: "/year",
    tagline: "For large institutes & university groups", cta: "Talk to Founder", featured: false,
    features: [
      "Unlimited students",
      "Custom AnswerCards for college-specific paths",
      "White-label option (powered by your college)",
      "API access for college systems",
      "Quarterly placement strategy report",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

function Check({ green }) {
  return (
    <span style={{
      flexShrink: 0, width: 16, height: 16, borderRadius: 5,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 700,
      background: green ? "rgba(61,190,130,0.12)" : "rgba(117,103,201,0.14)",
      color: green ? T.green : T.accentText,
    }}>✓</span>
  );
}

function Feature({ text, green }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: T.textSub, lineHeight: 1.45 }}>
      <Check green={green} />
      <span>{text}</span>
    </li>
  );
}

function SessionPricingNote() {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.cardBorder}`,
      borderRadius: 14, padding: "16px 20px", marginBottom: 32,
      display: "flex", flexWrap: "wrap", gap: 20,
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Pay-per-session (no subscription needed)
      </div>
      {/* Must match backend config/serviceCatalog.js prices */}
      {[
        { label: "Text Q&A",      sub: "48hr async", price: "₹49"  },
        { label: "Audio Call",    sub: "25 min",     price: "₹99"  },
        { label: "Resume Review", sub: "48hr async", price: "₹199" },
        { label: "Video Call",    sub: "45 min",     price: "₹299" },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{s.price}</div>
          <div style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>{s.label}</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>{s.sub}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: T.textMuted, maxWidth: 200, textAlign: "center", lineHeight: 1.5 }}>
        Seniors keep 83% · Atyant takes 17% · Powered by Razorpay UPI
      </div>
    </div>
  );
}

export default function UpgradePage({ onBack }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("student");
  const [billing, setBilling] = useState("monthly");
  const btnMonthlyRef = useRef(null);
  const btnYearlyRef  = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    if (btnMonthlyRef.current) {
      setSliderStyle({ width: btnMonthlyRef.current.offsetWidth, transform: "translateX(0)" });
    }
  }, [tab]);

  const setB = (mode) => {
    setBilling(mode);
    if (mode === "yearly" && btnYearlyRef.current) {
      setSliderStyle({ width: btnYearlyRef.current.offsetWidth, transform: `translateX(${btnMonthlyRef.current.offsetWidth}px)` });
    } else if (btnMonthlyRef.current) {
      setSliderStyle({ width: btnMonthlyRef.current.offsetWidth, transform: "translateX(0)" });
    }
  };

  const ctaStyle = (style) => {
    if (style === "accent") return { background: "linear-gradient(135deg,#7567C9,#9B8EE8)", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(117,103,201,0.3)" };
    if (style === "green")  return { background: "rgba(61,190,130,0.08)", color: T.green, border: `1px solid rgba(61,190,130,0.25)` };
    return { background: "transparent", color: T.textSub, border: `1px solid ${T.cardBorder}` };
  };

  return (
    <div style={{ position: "relative", minHeight: "100%", background: T.bg, fontFamily: "'Satoshi', sans-serif" }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", zIndex: 0, opacity: 0.1, background: T.accent, top: -100, right: -50 }} />
      <div style={{ position: "fixed", width: 300, height: 300, borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", zIndex: 0, opacity: 0.08, background: "#3A2A7C", bottom: -50, left: -50 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.accentSoft, border: `1px solid ${T.activeBorder}`, color: T.accentText, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, marginBottom: 14 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, animation: "pulse 2.2s ease-in-out infinite" }} />
            Simple, transparent pricing
          </div>

          <h1 style={{ fontFamily: "'Syne', 'Satoshi', sans-serif", fontSize: "clamp(26px,4.5vw,42px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10, color: T.text }}>
            Career clarity that{" "}
            <span style={{ background: "linear-gradient(130deg,#8E80DB 0%,#C4BAF5 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually moves you forward
            </span>
          </h1>

          <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Verified paths from seniors who walked your exact journey. Free to explore, affordable to go deep.
          </p>

          {/* Tab switcher */}
          <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", background: T.sidebar, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 4, gap: 4 }}>
            {[
              { key: "student", label: "For Students" },
              { key: "campus",  label: "For Colleges & B2B" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "none", transition: "all 0.2s",
                background: tab === t.key ? T.active : "transparent",
                color: tab === t.key ? T.text : T.textMuted,
                boxShadow: tab === t.key ? `0 0 0 1px ${T.activeBorder}` : "none",
                fontFamily: "inherit",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ STUDENT PLANS ══ */}
        {tab === "student" && (
          <>
            {/* Billing toggle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: T.sidebar, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 3, position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: 3, height: "calc(100% - 6px)", borderRadius: 7, background: T.active, border: `1px solid ${T.activeBorder}`, transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s", zIndex: 0, width: sliderStyle.width, transform: sliderStyle.transform }} />
                <button ref={btnMonthlyRef} onClick={() => setB("monthly")} style={{ position: "relative", zIndex: 1, padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: billing === "monthly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Monthly
                </button>
                <button ref={btnYearlyRef} onClick={() => setB("yearly")} style={{ position: "relative", zIndex: 1, padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: billing === "yearly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  Yearly
                  <span style={{ background: T.green, color: "#071a0e", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 100 }}>–20%</span>
                </button>
              </div>
            </div>

            {/* Session pricing note */}
            <SessionPricingNote />

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "stretch" }} className="up-grid-3">
              {STUDENT_PLANS.map((plan) => {
                const price = billing === "yearly" ? plan.yearly : plan.monthly;
                return (
                  <div key={plan.key} style={{
                    background: plan.featured ? T.active : T.card,
                    border: `1px solid ${plan.featured ? T.activeBorder : T.cardBorder}`,
                    borderRadius: 20, padding: plan.featured ? "38px 20px 24px" : "24px 20px",
                    position: "relative", display: "flex", flexDirection: "column",
                    boxShadow: plan.featured ? "0 10px 30px -10px rgba(117,103,201,0.25)" : "none",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}>
                    {plan.featured && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(130deg,#7567C9,#A89EEB)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(117,103,201,0.4)" }}>
                        ⭐ Most Popular
                      </div>
                    )}
                    {plan.featured && (
                      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "radial-gradient(ellipse at 50% -10%, rgba(117,103,201,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
                    )}

                    <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", background: plan.featured ? "#7567C9" : T.accentSoft, border: plan.featured ? "none" : `1px solid ${T.cardBorder}`, boxShadow: plan.featured ? "0 4px 14px rgba(117,103,201,0.35)" : "none" }}>
                      {plan.Icon && <plan.Icon size={20} color={plan.featured ? "#fff" : T.accentText} strokeWidth={2.2} />}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textSub, marginBottom: 3 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>{plan.tagline}</div>

                    {/* Price */}
                    <div style={{ marginBottom: 20 }}>
                      {price === 0 ? (
                        <div style={{ fontSize: 36, fontWeight: 800, color: T.text, lineHeight: 1 }}>Free</div>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: T.textSub }}>₹</span>
                            <span style={{ fontSize: 36, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{price}</span>
                            {billing === "yearly" && (
                              <span style={{ fontSize: 12, color: T.textMuted, textDecoration: "line-through", marginLeft: 6 }}>{plan.monthly}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                            {billing === "yearly" ? "per month, billed yearly" : "per month"}
                          </div>
                          {billing === "yearly" && (
                            <div style={{ fontSize: 11, color: T.green, marginTop: 2, fontWeight: 500 }}>
                              Save ₹{(plan.monthly - plan.yearly) * 12}/yr
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div style={{ height: 1, background: plan.featured ? T.activeBorder : T.cardBorder, marginBottom: 18 }} />

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                      {plan.features.map((f, i) => (
                        <Feature key={i} text={f.text} green={f.green} />
                      ))}
                    </ul>

                    <button 
                      onClick={() => {
                        if (plan.key === "free") {
                          onBack?.();
                        } else {
                          if (!user) {
                            toast.error("Please log in to purchase a subscription");
                            return;
                          }
                          purchaseSubscription({
                            plan: plan.key,
                            billing: billing,
                            onSuccess: (subscription) => {
                              toast.success(`${plan.name} plan activated! ${subscription.credits} session credits added.`);
                              onBack?.();
                            },
                            onError: (err) => {
                              toast.error(err.message || "Payment failed. Please try again.");
                            },
                          });
                        }
                      }}
                      style={{ width: "100%", padding: "11px 16px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", ...ctaStyle(plan.ctaStyle) }}
                    > 
                      {plan.cta}
                    </button>
                    
                    </div>
                );


              })}
            </div>

            {/* Compare table */}
            <div style={{ marginTop: 56, overflowX: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted, textAlign: "center", marginBottom: 20 }}>Full comparison</div>
              <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }} className="up-compare-table">
                <thead>
                  <tr>
                    {["Feature", "Explorer", "Clarity", "Pro"].map((h, i) => (
                      <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, padding: "10px 14px", textAlign: i === 0 ? "left" : "center", borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { section: "Content" },
                    { label: "AnswerCards",          cols: ["3 / search", "Unlimited", "Unlimited"],  types: ["val", "green", "green"] },
                    { label: "Senior profiles",      cols: ["Names only", "Full", "Full"],             types: ["val", "green", "green"] },
                    { label: "Session credits/mo",   cols: ["—", "1", "3"],                           types: ["no", "yes", "green"] },
                    { section: "Sessions" },
                    { label: "Session notes",        cols: ["—", "✓", "✓"],                           types: ["no", "yes", "green"] },
                    { label: "Mock interview cards", cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                    { label: "Resume review",        cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                    { section: "Reach" },
                    { label: "Senior matching SLA",  cols: ["—", "4 hrs", "Priority"],                types: ["no", "yes", "green"] },
                    { label: "WhatsApp connect",     cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                    { label: "Placement report",     cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                  ].map((row, i) => {
                    if (row.section) return (
                      <tr key={i}><td colSpan={4} style={{ padding: "20px 14px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>{row.section}</td></tr>
                    );
                    const color = (t) => t === "green" ? T.green : t === "yes" ? T.accentText : t === "val" ? T.text : T.textMuted;
                    return (
                      <tr key={i}>
                        <td style={{ padding: "10px 14px", color: T.text, borderBottom: `1px solid rgba(50,46,64,0.4)` }}>{row.label}</td>
                        {row.cols.map((v, j) => (
                          <td key={j} style={{ padding: "10px 14px", textAlign: "center", color: color(row.types[j]), fontWeight: row.types[j] === "val" ? 500 : 400, borderBottom: `1px solid rgba(50,46,64,0.4)` }}>{v}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ B2B / CAMPUS PLANS ══ */}
        {tab === "campus" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "stretch" }} className="up-grid-3">
            {B2B_PLANS.map((plan) => (
              <div key={plan.key} style={{
                background: plan.featured ? T.active : T.card,
                border: `1px solid ${plan.featured ? T.activeBorder : T.cardBorder}`,
                borderRadius: 20, padding: plan.featured ? "38px 20px 24px" : "24px 20px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: plan.featured ? "0 10px 30px -10px rgba(117,103,201,0.2)" : "none",
              }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(130deg,#7567C9,#A89EEB)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(117,103,201,0.4)" }}>
                    ⭐ Most Popular
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textSub, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 18, lineHeight: 1.5 }}>{plan.tagline}</div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{plan.price}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{plan.period}</div>
                </div>

                <div style={{ height: 1, background: plan.featured ? T.activeBorder : T.cardBorder, marginBottom: 16 }} />

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: T.textSub, lineHeight: 1.45 }}>
                      <Check green={true} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button style={{ width: "100%", padding: "11px 16px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", ...(plan.featured ? { background: "linear-gradient(135deg,#7567C9,#9B8EE8)", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(117,103,201,0.3)" } : { background: "transparent", color: T.textSub, border: `1px solid ${T.cardBorder}` }) }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, color: T.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>
          Prices in INR · Cancel anytime · No questions asked<br />
          Need help choosing? <span style={{ color: T.accentText, cursor: "pointer" }}>Chat with us</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.65); }
        }
        .up-grid-3 {
          grid-template-columns: repeat(3, 1fr) !important;
        }
        @media (max-width: 860px) {
          .up-grid-3 {
            grid-template-columns: 1fr !important;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
          }
        }
        @media (max-width: 540px) {
          .up-compare-table {
            font-size: 11px !important;
          }
          .up-compare-table th,
          .up-compare-table td {
            padding: 8px 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
