import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';

// Shared notes both sides can read and write during the call — same
// data-channel approach as Whiteboard.jsx, just a synced textarea instead of
// canvas strokes. Broadcasts are debounced (not sent per keystroke) so a fast
// typist doesn't flood the data channel or add any overhead to the call.
//
// Conflict handling is intentionally simple (last-write-wins by timestamp),
// and an incoming update never overwrites text while the local side is
// actively focused/typing — matching the whiteboard's "good enough for two
// people on a call" level of sophistication rather than building a real CRDT.
const TOPIC = 'atyant-notes';
const enc = new TextEncoder();
const dec = new TextDecoder();
const DEBOUNCE_MS = 300;

export default function SessionNotes({ top = 14, right = 14 }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');

    const lastTsRef = useRef(0);
    const focusedRef = useRef(false);
    const debounceRef = useRef(null);

    const onMessage = useCallback((msg) => {
        let d;
        try {
            d = JSON.parse(dec.decode(msg.payload));
        } catch {
            return;
        }
        if (d.t !== 'notes' || d.ts <= lastTsRef.current) return;
        lastTsRef.current = d.ts;
        // Don't rip text out from under someone mid-sentence — the next
        // broadcast after they blur/pause will reconcile both sides anyway.
        if (focusedRef.current) return;
        setText(d.text);
    }, []);

    const { send } = useDataChannel(TOPIC, onMessage);

    const broadcast = useCallback((value) => {
        const ts = Date.now();
        lastTsRef.current = ts;
        send(enc.encode(JSON.stringify({ t: 'notes', text: value, ts })), { reliable: true }).catch(() => {});
    }, [send]);

    const onChange = (e) => {
        const value = e.target.value;
        setText(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => broadcast(value), DEBOUNCE_MS);
    };

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="Shared notes"
                aria-label="Shared notes"
                style={{ ...fabBtn(top, right), ...(open ? fabActive : null) }}
            >
                <NotesIcon />
            </button>

            {open && (
                <div style={panel(top + 52, right)} role="dialog" aria-label="Shared notes">
                    <div style={panelHeader}>
                        <span style={panelTitle}>Shared notes</span>
                        <button type="button" onClick={() => setOpen(false)} style={closeBtn} aria-label="Close notes">
                            <CloseIcon />
                        </button>
                    </div>
                    <textarea
                        value={text}
                        onChange={onChange}
                        onFocus={() => { focusedRef.current = true; }}
                        onBlur={() => {
                            focusedRef.current = false;
                            clearTimeout(debounceRef.current);
                            broadcast(text);
                        }}
                        placeholder="Notes both of you can see and edit…"
                        style={textarea}
                    />
                    <div style={hint}>Visible to everyone on this call.</div>
                </div>
            )}
        </>
    );
}

/* ── icons ── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const NotesIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" {...stroke}>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M9 13h6" /><path d="M9 17h4" />
    </svg>
);
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);

/* ── styles ── */
const fabBtn = (top, right) => ({
    position: 'fixed',
    top,
    right,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(20,20,26,0.72)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
});
const fabActive = { background: '#7567C9', borderColor: '#7567C9' };
const panel = (top, right) => ({
    position: 'fixed',
    top,
    right,
    zIndex: 1000,
    width: 280,
    padding: 12,
    borderRadius: 14,
    background: 'rgba(24,24,30,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 12px 34px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
});
const panelHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const panelTitle = { color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' };
const closeBtn = {
    width: 26, height: 26, borderRadius: 7, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
};
const textarea = {
    width: '100%',
    height: 180,
    resize: 'vertical',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 13,
    lineHeight: 1.5,
    padding: 10,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
};
const hint = { color: 'rgba(255,255,255,0.45)', fontSize: 10.5, lineHeight: 1.35 };
