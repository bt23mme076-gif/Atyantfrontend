import { useState, useEffect } from "react";
import {
  Bot, ShieldCheck, Building2, Plus, X, Check, Loader2,
  AlertTriangle, ExternalLink, Power, Crown, Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobsAPI } from "../api";
import { canAutoApply } from "../lib/plan";

// Theme palette — maps to CSS vars defined in index.css (light + dark).
const C = {
  bg:           "var(--c-bg)",
  card:         "var(--c-card)",
  cardHover:    "var(--c-cardHover)",
  cardBorder:   "var(--c-cardBorder)",
  active:       "var(--c-active)",
  activeBorder: "var(--c-activeBorder)",
  accent:       "#7567C9",
  accentSoft:   "var(--c-accentSoft)",
  accentText:   "var(--c-accentText)",
  text:         "var(--c-text)",
  textSub:      "var(--c-textSub)",
  textMuted:    "var(--c-textMuted)",
  green:        "#3DBE82",
  red:          "#F87171",
  orange:       "#FB923C",
};

function Spin({ size = 16 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

const STATUS_STYLE = {
  submitted:            { label: "Submitted",             color: C.green,  },
  queued:               { label: "Queued",                color: C.textMuted },
  needs_manual_action:  { label: "Needs your action",     color: C.orange },
  failed:               { label: "Failed",                color: C.red    },
};

// Same deterministic company colour as the Jobs page tiles.
const COMPANY_HUES = ["#7567C9", "#3DBE82", "#FB923C", "#3B82F6", "#EC4899", "#F59E0B", "#14B8A6"];
function companyHue(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COMPANY_HUES[Math.abs(hash) % COMPANY_HUES.length];
}

const APPS_PREVIEW = 8;   // rows shown before "Show all"

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { label: status, color: C.textMuted };
  return (
    <span style={{
      fontSize: ".68rem", fontWeight: 700, color: s.color,
      background: `${s.color}18`, border: `1px solid ${s.color}44`,
      borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ─── Auto-Apply Settings ──────────────────────────────────────────────────────
// Opt-in Greenhouse/Lever auto-apply. Enabling requires an explicit consent
// checkbox (mirrors the backend's confirm:true gate) — this is never a
// silent default-on toggle. Disabling is instant, no friction (kill switch).
export default function AutoApplySettings({ onUpgrade }) {
  const { user, setUser } = useAuth();
  const autoApply = user?.autoApply || {};
  // Paid feature (Clarity or Pro). Free users see an upgrade card instead of the switch;
  // anyone who turned it on before it was paid can still turn it off.
  const paid = canAutoApply(user);

  const [minMatchScore, setMinMatchScore] = useState(autoApply.minMatchScore ?? 70);
  const [phone, setPhone] = useState(autoApply.phone || "");
  const [excludedCompanies, setExcludedCompanies] = useState(autoApply.excludedCompanies || []);
  const [companyInput, setCompanyInput] = useState("");

  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [applications, setApplications] = useState(null); // null = not loaded yet
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAllApps, setShowAllApps] = useState(false);

  useEffect(() => {
    setMinMatchScore(autoApply.minMatchScore ?? 70);
    setPhone(autoApply.phone || "");
    setExcludedCompanies(autoApply.excludedCompanies || []);
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await jobsAPI.applications();
      setApplications(res.applications || []);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (autoApply.enabled && applications === null) loadApplications();
  }, [autoApply.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const addExcludedCompany = () => {
    const v = companyInput.trim();
    if (!v || excludedCompanies.includes(v)) { setCompanyInput(""); return; }
    setExcludedCompanies(prev => [...prev, v]);
    setCompanyInput("");
  };

  const removeExcludedCompany = (name) => {
    setExcludedCompanies(prev => prev.filter(c => c !== name));
  };

  // Save score/excluded-companies/phone without touching the enabled flag.
  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await jobsAPI.updateAutoApplySettings({ minMatchScore, excludedCompanies, phone });
      setUser(prev => ({ ...prev, autoApply: res.autoApply }));
      setMsg("Settings saved");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const enableAutoApply = async () => {
    if (!consentChecked) return;
    setSaving(true);
    setError("");
    try {
      const res = await jobsAPI.updateAutoApplySettings({
        enabled: true, confirm: true, minMatchScore, excludedCompanies, phone,
      });
      setUser(prev => ({ ...prev, autoApply: res.autoApply }));
      setShowConsent(false);
      setConsentChecked(false);
      setMsg("Auto-Apply is on");
    } catch (err) {
      setError(err.data?.code === "PLAN_REQUIRED"
        ? "Auto-apply is part of the Clarity and Pro plans. Upgrade to turn it on."
        : err.message || "Failed to enable auto-apply");
    } finally {
      setSaving(false);
    }
  };

  const disableAutoApply = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await jobsAPI.updateAutoApplySettings({ enabled: false });
      setUser(prev => ({ ...prev, autoApply: res.autoApply }));
      setShowConsent(false);
      setMsg("Auto-Apply is off");
    } catch (err) {
      setError(err.message || "Failed to disable auto-apply");
    } finally {
      setSaving(false);
    }
  };

  const hasResume = !!user?.resumeUrl;

  // ── Free plan: locked card ──
  if (!paid && !autoApply.enabled) {
    return (
      <div className="pf-card pf-anim" style={{ background: C.card, border: "1px solid rgba(217,119,6,0.35)", borderRadius: 12, marginBottom: 18, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={15} color={C.accentText} />
            <span style={{ fontSize: ".85rem", fontWeight: 700, color: C.text }}>Auto-Apply</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".62rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: "#B45309", borderRadius: 4, padding: "2px 6px" }}>
              <Crown size={10} /> Premium
            </span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: ".72rem", fontWeight: 600, color: C.textMuted }}>
            <Lock size={12} /> Locked
          </span>
        </div>
        <div style={{ fontSize: ".8rem", color: C.textSub, margin: "8px 0 12px", lineHeight: 1.5 }}>
          We fill in and submit applications for Greenhouse and Lever jobs that match your resume, so you don't have to.
          Auto-apply comes with the Clarity and Pro plans.
        </div>
        <button onClick={() => onUpgrade?.()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".8rem", fontWeight: 700, color: "#fff", background: "#B45309", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
          <Crown size={13} /> Upgrade to turn on
        </button>
      </div>
    );
  }

  return (
    <div className="pf-card pf-anim" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, marginBottom: 18, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={15} color={C.accentText} />
          <span style={{ fontSize: ".85rem", fontWeight: 700, color: C.text }}>Auto-Apply</span>
        </div>

        {autoApply.enabled ? (
          <button
            onClick={disableAutoApply}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: ".72rem", fontWeight: 700,
              color: C.green, background: `${C.green}18`, border: `1px solid ${C.green}44`,
              borderRadius: 999, padding: "4px 11px", cursor: saving ? "default" : "pointer",
            }}
            title="Turn off — takes effect immediately"
          >
            {saving ? <Spin size={12} /> : <Power size={12} />} On — tap to turn off
          </button>
        ) : (
          <button
            onClick={() => setShowConsent(true)}
            disabled={!hasResume}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: ".72rem", fontWeight: 700,
              color: hasResume ? C.textSub : C.textMuted,
              background: C.active, border: `1px solid ${C.cardBorder}`,
              borderRadius: 999, padding: "4px 11px", cursor: hasResume ? "pointer" : "not-allowed",
            }}
          >
            <Power size={12} /> Off — tap to enable
          </button>
        )}
      </div>

      <div style={{ fontSize: ".72rem", color: C.textMuted, marginBottom: 14 }}>
        Automatically applies to Greenhouse &amp; Lever jobs that match your profile above your score threshold.
        Forms with custom screening questions are left for you to finish — never auto-answered.
      </div>

      {!paid && autoApply.enabled && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.35)", borderRadius: 10, padding: "9px 12px", marginBottom: 14, fontSize: ".76rem", color: "#C2620A" }}>
          <Crown size={14} /> Paused: auto-apply now needs a Clarity or Pro plan. No new applications go out until you upgrade.
          <button onClick={() => onUpgrade?.()} style={{ marginLeft: "auto", fontSize: ".74rem", fontWeight: 700, color: "#fff", background: "#B45309", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>
            Upgrade
          </button>
        </div>
      )}

      {!hasResume && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${C.orange}14`, border: `1px solid ${C.orange}44`, borderRadius: 10, padding: "9px 12px", marginBottom: 14, fontSize: ".76rem", color: C.orange }}>
          <AlertTriangle size={14} /> Upload a resume above before enabling auto-apply.
        </div>
      )}

      {/* ── Consent panel — shown only when turning ON ── */}
      {showConsent && !autoApply.enabled && (
        <div style={{ background: C.active, border: `1px solid ${C.accent}55`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ShieldCheck size={15} color={C.accentText} />
            <span style={{ fontSize: ".8rem", fontWeight: 700, color: C.text }}>Before you turn this on</span>
          </div>
          <ul style={{ margin: "0 0 12px", padding: "0 0 0 18px", fontSize: ".76rem", color: C.textSub, lineHeight: 1.6 }}>
            <li>Atyant will submit applications to Greenhouse and Lever job postings on your behalf, using your resume and profile data.</li>
            <li>If a form has questions beyond name/email/phone/resume/links, it's left as "Needs your action" for you to finish — never guessed.</li>
            <li>If a form shows a CAPTCHA, it's skipped for manual completion.</li>
            <li>You can turn this off anytime — it takes effect immediately.</li>
          </ul>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: ".78rem", color: C.text, cursor: "pointer", marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={e => setConsentChecked(e.target.checked)}
              style={{ marginTop: 2, cursor: "pointer" }}
            />
            I authorize Atyant to submit job applications on my behalf as described above.
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={enableAutoApply}
              disabled={!consentChecked || saving}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", fontWeight: 700,
                color: "#fff", background: consentChecked ? C.accent : C.textMuted,
                border: "none", borderRadius: 9, padding: "8px 14px",
                cursor: consentChecked && !saving ? "pointer" : "not-allowed",
              }}
            >
              {saving ? <Spin size={13} /> : <Check size={13} />} Enable Auto-Apply
            </button>
            <button
              onClick={() => { setShowConsent(false); setConsentChecked(false); }}
              style={{ fontSize: ".76rem", fontWeight: 600, color: C.textSub, background: "none", border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: ".72rem", fontWeight: 600, color: C.textSub, display: "block", marginBottom: 5 }}>
            Minimum match score ({minMatchScore}%)
          </label>
          <input
            type="range" min="0" max="100" step="5"
            value={minMatchScore}
            onChange={e => setMinMatchScore(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: ".72rem", fontWeight: 600, color: C.textSub, display: "block", marginBottom: 5 }}>
            Phone (used on application forms)
          </label>
          <input
            className="pf-input"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label style={{ fontSize: ".72rem", fontWeight: 600, color: C.textSub, display: "block", marginBottom: 5 }}>
            Excluded companies
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: excludedCompanies.length ? 8 : 0 }}>
            <input
              className="pf-input"
              value={companyInput}
              onChange={e => setCompanyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addExcludedCompany(); } }}
              placeholder="e.g. stripe"
            />
            <button
              onClick={addExcludedCompany}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".74rem", fontWeight: 600, color: C.accentText, background: C.accentSoft, border: "none", borderRadius: 9, padding: "0 12px", cursor: "pointer" }}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          {excludedCompanies.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {excludedCompanies.map(name => (
                <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".72rem", color: C.textSub, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "3px 6px 3px 10px" }}>
                  <Building2 size={11} /> {name}
                  <button onClick={() => removeExcludedCompany(name)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 1 }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        style={{ fontSize: ".74rem", fontWeight: 700, color: C.accentText, background: C.accentSoft, border: "none", borderRadius: 9, padding: "8px 14px", cursor: saving ? "default" : "pointer" }}
      >
        {saving ? "Saving…" : "Save settings"}
      </button>

      {msg && <div style={{ fontSize: ".74rem", marginTop: 8, color: C.green }}>✓ {msg}</div>}
      {error && <div style={{ fontSize: ".74rem", marginTop: 8, color: C.red }}>{error}</div>}

      {/* ── Application audit trail ── */}
      {autoApply.enabled && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ fontSize: ".86rem", fontWeight: 700, color: C.text }}>
              Applications {applications ? `(${applications.length})` : ""}
            </div>
            {applications?.length > 0 && (() => {
              const counts = applications.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {});
              return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["submitted", "needs_manual_action", "queued", "failed"].filter(k => counts[k]).map(k => (
                    <span key={k} style={{ fontSize: ".7rem", fontWeight: 600, color: STATUS_STYLE[k].color, background: `${STATUS_STYLE[k].color}14`, borderRadius: 6, padding: "3px 8px" }}>
                      {counts[k]} {STATUS_STYLE[k].label.toLowerCase()}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          {loadingApps && <div style={{ fontSize: ".76rem", color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}><Spin size={13} /> Loading…</div>}

          {!loadingApps && applications?.length === 0 && (
            <div style={{ fontSize: ".78rem", color: C.textMuted }}>No applications yet. We check for matching jobs every 30 minutes.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {!loadingApps && (showAllApps ? applications : applications?.slice(0, APPS_PREVIEW))?.map(app => {
              const company = app.job?.company || "";
              const hue = companyHue(company);
              const needsAction = app.status === "needs_manual_action" && app.job?.applyUrl;
              return (
                <div key={app._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${C.cardBorder}`, borderRadius: 10, background: C.card }}>
                  {/* Company tile */}
                  <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${hue}1f`, border: `1px solid ${hue}44`, color: hue, fontWeight: 700, fontSize: ".95rem", textTransform: "uppercase" }}>
                    {company[0] || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".84rem", fontWeight: 600, color: C.text, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {app.job?.title || "Job removed"}
                    </div>
                    {company && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: ".72rem", fontWeight: 600, color: C.textSub, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: "2px 8px", textTransform: "capitalize" }}>
                        <Building2 size={11} /> {company}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <StatusBadge status={app.status} />
                    {needsAction && (
                      <a href={app.job.applyUrl} target="_blank" rel="noopener noreferrer" title="Finish this application on the company site"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".72rem", fontWeight: 700, color: C.accentText, textDecoration: "none" }}>
                        Finish <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!loadingApps && applications?.length > APPS_PREVIEW && (
            <button onClick={() => setShowAllApps(v => !v)}
              style={{ marginTop: 10, width: "100%", fontSize: ".8rem", fontWeight: 600, color: C.accentText, background: "none", border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>
              {showAllApps ? "Show fewer" : `Show all ${applications.length} applications`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
