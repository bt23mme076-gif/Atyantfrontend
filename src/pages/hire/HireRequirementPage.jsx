import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Phone, Mail, BadgeCheck, Users, EyeOff, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { hireAPI } from "../../api";
import { TopBar, HirePage } from "./HireShared";
import { Aurora, Confetti } from "./HireFx";

const EASE = [0.22, 1, 0.36, 1];
const card = { initial: { opacity: 0, y: 20, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.55, ease: EASE } };

const ROLES = ["Frontend", "Backend", "Full-stack", "AI/ML", "Data analyst", "UI/UX design", "Marketing", "Sales/BD", "Operations", "Other"];

// Five fields only. Stipend, number of interns, duration and start date are
// settled on the follow-up call.
const EMPTY_ROLE = { roleChoice: "", roleOther: "" };
const EMPTY = { company: "", contactName: "", phone: "", email: "", ...EMPTY_ROLE, website: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleOf = (f) => (f.roleChoice === "Other" ? f.roleOther.trim() : f.roleChoice);

// In page order, so the first error is the one we scroll to.
function validate(f) {
  const e = {};
  if (!f.company.trim()) e.company = "Enter your startup's name.";
  if (!f.contactName.trim()) e.contactName = "Enter your name.";
  const digits = f.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) e.phone = "Enter a 10-digit mobile number.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email, like name@startup.com.";
  if (!f.roleChoice) e.roleChoice = "Pick the internship role.";
  else if (f.roleChoice === "Other" && !f.roleOther.trim()) e.roleOther = "Type the role you're hiring for.";
  return e;
}

function focusField(k) {
  const el = document.getElementById(`rq-${k}`);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.focus({ preventScroll: true });
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label className="hr-label" htmlFor={`rq-${id}`}>{label}</label>
      {children}
      {error && <div className="hr-ferr" id={`rq-${id}-msg`}>{error}</div>}
    </div>
  );
}

function RequirementForm({ initial, onDone }) {
  const [params] = useSearchParams();
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const otherRef = useRef(null);

  const update = (k, val) => {
    setF(v => ({ ...v, [k]: val }));
    setErrors(e => (e[k] ? { ...e, [k]: undefined } : e));
    setError("");
  };
  const set = (k) => (e) => update(k, e.target.value);

  useEffect(() => { if (f.roleChoice === "Other") otherRef.current?.focus(); }, [f.roleChoice]);

  const input = (k) => ({
    id: `rq-${k}`, value: f[k], onChange: set(k),
    className: `hr-input${errors[k] ? " bad" : ""}`,
    "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `rq-${k}-msg` : undefined,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate(f);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) return focusField(first);
    setBusy(true);
    const body = { company: f.company, contactName: f.contactName, phone: f.phone, email: f.email, role: roleOf(f), website: f.website, source: params.get("src") || "link" };
    try {
      await hireAPI.submitRequirement(body);
      onDone({ ...f, role: body.role });
    } catch (err) {
      // The server names the field it rejected; show the message there.
      let field = err.data?.field;
      if (field === "role") field = f.roleChoice === "Other" ? "roleOther" : "roleChoice";
      if (field && document.getElementById(`rq-${field}`)) { setErrors({ [field]: err.message }); focusField(field); }
      else setError(err.message || "Could not send. Please try again.");
      setBusy(false);
    }
  };

  return (
    <motion.form className="hr-card pad-lg hr-col hr-gborder" style={{ gap: 16 }} onSubmit={submit} noValidate {...card} transition={{ ...card.transition, delay: 0.15 }}>
      <div className="hr-row" style={{ gap: 12 }}>
        <span className="hr-icon-badge solid"><Sparkles size={18} /></span>
        <div className="hr-col" style={{ gap: 2 }}>
          <div className="hr-h3" style={{ fontSize: "1.15rem" }}>Share your requirement</div>
          <span className="hr-muted">Five quick fields. We'll discuss the rest on a call.</span>
        </div>
      </div>

      <div className="hr-grid c2" style={{ alignItems: "start" }}>
        <Field id="company" label="Startup name" error={errors.company}>
          <input {...input("company")} maxLength={120} autoComplete="organization" />
        </Field>
        <Field id="contactName" label="Your name" error={errors.contactName}>
          <input {...input("contactName")} maxLength={120} autoComplete="name" />
        </Field>
        <Field id="phone" label="WhatsApp number" error={errors.phone}>
          <input {...input("phone")} type="tel" inputMode="tel" maxLength={16} autoComplete="tel" placeholder="10-digit number" />
        </Field>
        <Field id="email" label="Work email" error={errors.email}>
          <input {...input("email")} type="email" maxLength={200} autoComplete="email" placeholder="name@startup.com" />
        </Field>
      </div>

      <div>
        <span className="hr-label" id="rq-roleChoice-label">Internship role</span>
        <div className="hr-opts" id="rq-roleChoice" tabIndex={-1} role="radiogroup" aria-labelledby="rq-roleChoice-label" aria-invalid={!!errors.roleChoice || undefined}>
          {ROLES.map(r => (
            <button type="button" key={r} role="radio" aria-checked={f.roleChoice === r} className={`hr-opt ${f.roleChoice === r ? "on" : ""}`} onClick={() => update("roleChoice", r)}>{r}</button>
          ))}
        </div>
        {errors.roleChoice && <div className="hr-ferr">{errors.roleChoice}</div>}
        <AnimatePresence initial={false}>
          {f.roleChoice === "Other" && (
            <motion.div key="other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE }} style={{ overflow: "hidden" }}>
              <div style={{ paddingTop: 10 }}>
                <input {...input("roleOther")} ref={otherRef} maxLength={120} placeholder="Type the role, e.g. Content writer" aria-label="Specify the role" />
                {errors.roleOther && <div className="hr-ferr" id="rq-roleOther-msg">{errors.roleOther}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />

      {error && <motion.div className="hr-error" role="alert" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [6, -4, 2, 0] }}>{error}</motion.div>}
      <div className="hr-col" style={{ gap: 10, marginTop: 4 }}>
        <button className="hr-btn primary lg block" disabled={busy}>{busy ? "Sending…" : "Send requirement"} {!busy && <ArrowRight size={16} className="hr-arrow" />}</button>
        <div className="hr-col hr-muted" style={{ textAlign: "center", fontSize: ".8rem", gap: 3, lineHeight: 1.45 }}>
          <span><b style={{ color: "var(--c-textSub)" }}>Free to share.</b></span>
          <span><ShieldCheck size={12} style={{ verticalAlign: "-2px" }} /> We'll call you within 1 business day to discuss stipend and other details. We don't share your details with students.</span>
        </div>
      </div>
    </motion.form>
  );
}

function Done({ sent, onAnother }) {
  const steps = [
    ["A short call", "We settle the stipend, number of interns, duration and start date."],
    ["A one-page agreement", "Signed before any profile goes out."],
    ["3 to 5 profiles", "Only students who cleared an AI interview built from your role."],
  ];
  return (
    <>
      <Confetti />
      <motion.div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 14, overflow: "hidden" }} {...card} role="status">
        <Aurora grid={false} className="soft" />
        <svg className="hr-checkdraw" viewBox="0 0 84 84" aria-hidden="true" style={{ position: "relative" }}>
          <circle cx="42" cy="42" r="38" />
          <path d="M26 43 l11 11 l21 -23" />
        </svg>
        <div className="hr-h2" style={{ position: "relative" }}>Requirement <em className="hr-grad-text">received</em></div>
        <p className="hr-sub" style={{ maxWidth: 440, fontSize: ".97rem", position: "relative" }}>
          Thanks, {sent.contactName.trim().split(/\s+/)[0]}. Your <b>{sent.role}</b> intern requirement is with Team Atyant.
          We'll call you on <b>{sent.phone}</b> within 1 business day.
        </p>
        <div className="hr-col" style={{ gap: 10, width: "100%", maxWidth: 440, textAlign: "left", marginTop: 6, position: "relative" }}>
          {steps.map(([t, d], i) => (
            <motion.div key={t} className="hr-tip" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.12, ease: EASE, duration: 0.5 }}>
              <span className="hr-icon-badge solid" style={{ width: 30, height: 30, borderRadius: 9, fontSize: ".8rem", fontWeight: 700 }}>{i + 1}</span>
              <div className="hr-col" style={{ gap: 2 }}><b>{t}</b><span className="hr-muted" style={{ lineHeight: 1.45 }}>{d}</span></div>
            </motion.div>
          ))}
        </div>
        <div className="hr-row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8, position: "relative" }}>
          <button className="hr-btn" onClick={onAnother}><RotateCcw size={15} /> Share another role</button>
          <a className="hr-btn ghost" href="mailto:support@atyant.in"><Mail size={15} /> support@atyant.in</a>
        </div>
      </motion.div>
    </>
  );
}

export default function HireRequirementPage() {
  const [sent, setSent] = useState(null);
  const [initial, setInitial] = useState(EMPTY);
  const another = () => { setInitial({ ...sent, ...EMPTY_ROLE, website: "" }); setSent(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <HirePage>
      <Aurora />
      <TopBar>
        <a className="hr-btn sm ghost hide-sm" href="tel:+919579040183"><Phone size={14} /> +91 95790 40183</a>
      </TopBar>
      <main className="hr-narrow hr-col" style={{ gap: 22 }}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="done" className="hr-col" style={{ gap: 22 }}><Done sent={sent} onAnother={another} /></motion.div>
          ) : (
            <motion.div key="form" className="hr-col" style={{ gap: 22 }} exit={{ opacity: 0, y: -12 }}>
              <motion.header className="hr-col" style={{ gap: 12 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                <span className="hr-eyebrow">Atyant Hire · For startups</span>
                <h1 className="hr-h1" style={{ fontSize: "clamp(2rem, 6vw, 2.9rem)" }}>Hire an intern <em className="hr-grad-text">for your startup</em></h1>
                <p className="hr-sub" style={{ fontSize: ".98rem" }}>Takes 30 seconds. We screen students and send you 3 to 5 who cleared an interview built for your role.</p>
                <div className="hr-row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="hr-chip"><BadgeCheck size={13} /> No fee until your intern joins</span>
                  <span className="hr-chip"><Users size={13} /> 3 to 5 tested profiles</span>
                  <span className="hr-chip"><EyeOff size={13} /> Posted under Atyant's name</span>
                </div>
              </motion.header>
              <RequirementForm initial={initial} onDone={setSent} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </HirePage>
  );
}
