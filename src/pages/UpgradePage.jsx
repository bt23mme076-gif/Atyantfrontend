import { useState, useEffect, useRef } from "react";
import { Compass, Target, Rocket } from "lucide-react";
import { purchaseSubscription } from "../lib/subscriptionCheckout";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";

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
      { text: "Auto-apply to jobs that match your resume", green: true },
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
      borderRadius: 12, padding: "16px 20px", marginBottom: 24,
      display: "flex", flexWrap: "wrap", gap: 20,
      alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Pay-per-session (no subscription needed)
      </div>
      {/* Must match backend config/serviceCatalog.js prices */}
      {[
        { label: "Text Q&A",      sub: "48hr async", price: "₹49"  },
        { label: "Audio Call",    sub: "15 min",     price: "₹99"  },
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
  const { user, refreshUser } = useAuth();
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
    if (style === "accent") return { background: T.accent, color: "#fff", border: "none" };
    if (style === "green")  return { background: "rgba(61,190,130,0.08)", color: T.green, border: `1px solid rgba(61,190,130,0.25)` };
    return { background: "transparent", color: T.textSub, border: `1px solid ${T.cardBorder}` };
  };

  return (
    <div style={{ position: "relative", minHeight: "100%", background: T.bg, fontFamily: "var(--font-body)" }}>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <PageHeader
            title="Plans and pricing"
            subtitle="Exploring is free. Pay when you want full senior profiles, sessions and deeper prep. Every price is in rupees and you can cancel anytime."
            style={{ marginBottom: 18 }}
          />

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
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: T.sidebar, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 3, position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: 3, height: "calc(100% - 6px)", borderRadius: 7, background: T.active, border: `1px solid ${T.activeBorder}`, transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s", zIndex: 0, width: sliderStyle.width, transform: sliderStyle.transform }} />
                <button ref={btnMonthlyRef} onClick={() => setB("monthly")} style={{ position: "relative", zIndex: 1, padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: billing === "monthly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Monthly
                </button>
                <button ref={btnYearlyRef} onClick={() => setB("yearly")} style={{ position: "relative", zIndex: 1, padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: billing === "yearly" ? T.text : T.textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  Yearly
                  <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>save 20%</span>
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
                    borderRadius: 12, padding: "24px 20px",
                    position: "relative", display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: T.text }}>
                        {plan.Icon && <plan.Icon size={17} color={T.accentText} strokeWidth={2} />}
                        {plan.name}
                      </div>
                      {plan.featured && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.accent, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>Most popular</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: T.textSub, marginBottom: 18, lineHeight: 1.5 }}>{plan.tagline}</div>

                    {/* Price */}
                    <div style={{ marginBottom: 20 }}>
                      {price === 0 ? (
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: T.text, lineHeight: 1 }}>Free</div>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: T.textSub }}>₹</span>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 36, color: T.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{price}</span>
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
                            prefill: {
                              name: user?.name || user?.username || "",
                              email: user?.email || "",
                              contact: user?.phone || "",
                            },
                            onSuccess: (subscription) => {
                              toast.success(`${plan.name} plan activated! ${subscription.credits} session credits added.`);
                              refreshUser();
                              onBack?.();
                            },
                            onError: (err) => {
                              toast.error(typeof err === "string" ? err : err?.message || "Payment failed. Please try again.");
                            },
                          });
                        }
                      }}
                      style={{ width: "100%", padding: "11px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "filter 0.15s", ...ctaStyle(plan.ctaStyle) }}
                    > 
                      {plan.cta}
                    </button>
                    
                    </div>
                );


              })}
            </div>

            {/* Compare table */}
            <div style={{ marginTop: 56, overflowX: "auto" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.3rem", color: T.text, margin: "0 0 14px" }}>Compare plans</h2>
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
                    { label: "Auto-apply to jobs",   cols: ["—", "✓", "✓"],                           types: ["no", "yes", "green"] },
                    { label: "WhatsApp connect",     cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                    { label: "Placement report",     cols: ["—", "—", "✓"],                           types: ["no", "no", "green"] },
                  ].map((row, i) => {
                    if (row.section) return (
                      <tr key={i}><td colSpan={4} style={{ padding: "20px 14px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>{row.section}</td></tr>
                    );
                    const color = (t) => t === "green" ? T.green : t === "yes" ? T.accentText : t === "val" ? T.text : T.textMuted;
                    return (
                      <tr key={i}>
                        <td style={{ padding: "10px 14px", color: T.text, borderBottom: `1px solid ${T.cardBorder}` }}>{row.label}</td>
                        {row.cols.map((v, j) => (
                          <td key={j} style={{ padding: "10px 14px", textAlign: "center", color: color(row.types[j]), fontWeight: row.types[j] === "val" ? 500 : 400, borderBottom: `1px solid ${T.cardBorder}` }}>{v}</td>
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
                borderRadius: 12, padding: "24px 20px",
                position: "relative", display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{plan.name}</div>
                  {plan.featured && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.accent, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>Most popular</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 18, lineHeight: 1.5 }}>{plan.tagline}</div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: T.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{plan.price}</span>
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

                <button style={{ width: "100%", padding: "11px 16px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", ...(plan.featured ? { background: T.accent, color: "#fff", border: "none" } : { background: "transparent", color: T.textSub, border: `1px solid ${T.cardBorder}` }) }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, color: T.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>
          Prices in INR. Cancel anytime.<br />
          Need help choosing? <span style={{ color: T.accentText, cursor: "pointer" }}>Chat with us</span>
        </div>
      </div>

      <style>{`
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
