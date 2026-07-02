import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';

// One shared data-channel topic for all whiteboard + notes traffic. `send`
// from useDataChannel(topic, …) auto-attaches this topic to every outgoing
// packet.
const TOPIC = 'atyant-wb';
const enc = new TextEncoder();
const dec = new TextDecoder();

// Fixed backing-store resolution for the drawing canvas. Both peers draw into
// the same 1600×900 buffer and coordinates travel normalised (0..1), so
// strokes land identically on any screen size. The canvas's CSS box is kept
// at the same 16:9 shape (see .meet-canvas-wrap in index.css) specifically so
// stretching to fill it never distorts a stroke, even though the two sides
// may have independently resized their own panel to a different absolute size.
const BW = 1600;
const BH = 900;

const COLORS = ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#7567C9'];
const SIZES = [{ w: 4, r: 6 }, { w: 8, r: 8 }, { w: 16, r: 11 }];
const ERASER_W = 44;
const NOTES_DEBOUNCE_MS = 300;

// Panel size presets (px). These drive a CSS flex-basis on the room layout's
// main axis, which is width on desktop (docked right) and height on narrow
// screens (docked bottom — index.css flips flex-direction under 760px), so
// the same numbers double as sane values for either axis.
const PRESETS = { small: 340, medium: 460, large: 640 };
const MIN_SIZE = 300;
// Hard floor reserved for the video pane no matter how far the board is
// resized — this is what actually guarantees a participant is never fully
// hidden, not just a visual suggestion.
const VIDEO_RESERVE = 280;

function isNarrowViewport() {
    return window.matchMedia('(max-width: 760px)').matches;
}
function clampSize(px, narrow) {
    const viewportMax = narrow ? window.innerHeight : window.innerWidth;
    return Math.min(Math.max(px, MIN_SIZE), Math.max(MIN_SIZE, viewportMax - VIDEO_RESERVE));
}

/**
 * Docked, resizable session panel combining the shared whiteboard AND shared
 * notes in one place (a Draw/Notes toggle switches the view — nothing about
 * "removing the separate notes button" loses content, since both the canvas
 * and the notes textarea stay mounted underneath and only `display` toggles).
 *
 * Docks as a real flex sibling of the video area (see .meet-board-dock /
 * .meet-video-pane in index.css) rather than a full-screen overlay, so the
 * video pane's box actually shrinks and LiveKit's own responsive grid layout
 * reflows the tiles — the video is resized, never covered.
 *
 * `open` is controlled by the parent (shared with the "hide BackgroundControl
 * while the board is open" decision in MeetPage) and also mirrors the
 * existing behaviour of auto-opening for the other participant on any
 * incoming stroke/note/open message.
 */
export default function Whiteboard({ open, onOpenChange, top = 14, right = 14 }) {
    const [mode, setMode] = useState('draw'); // 'draw' | 'notes'
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState(COLORS[0]);
    const [sizeIdx, setSizeIdx] = useState(1);
    const [size, setSize] = useState(PRESETS.medium);
    const [dragging, setDragging] = useState(false);
    const [notesText, setNotesText] = useState('');

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const drawingRef = useRef(null);
    const lastRef = useRef(null);

    const notesTsRef = useRef(0);
    const notesFocusedRef = useRef(false);
    const notesDebounceRef = useRef(null);
    const dragStateRef = useRef(null);

    const getCtx = () => {
        if (ctxRef.current) return ctxRef.current;
        const c = canvasRef.current;
        if (!c) return null;
        const ctx = c.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
        return ctx;
    };

    // Paint one segment (or a dot when the endpoints coincide) into the buffer.
    const paint = useCallback((s) => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.globalCompositeOperation = s.e ? 'destination-out' : 'source-over';
        ctx.strokeStyle = s.c || '#111827';
        ctx.fillStyle = s.c || '#111827';
        ctx.lineWidth = s.w;
        const x0 = s.x0 * BW, y0 = s.y0 * BH, x1 = s.x1 * BW, y1 = s.y1 * BH;
        if (x0 === x1 && y0 === y1) {
            ctx.beginPath();
            ctx.arc(x0, y0, Math.max(0.5, s.w / 2), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    const clearLocal = useCallback(() => {
        const ctx = getCtx();
        if (ctx) ctx.clearRect(0, 0, BW, BH);
    }, []);

    // Incoming messages from the peer. Stable — reads refs, not state.
    const onMessage = useCallback((msg) => {
        let d;
        try {
            d = JSON.parse(dec.decode(msg.payload));
        } catch {
            return;
        }
        if (d.t === 'seg') {
            onOpenChange(true); // defensive: a stroke always means the board is live
            paint(d);
        } else if (d.t === 'clear') {
            clearLocal();
        } else if (d.t === 'open') {
            onOpenChange(true);
        } else if (d.t === 'close') {
            onOpenChange(false);
        } else if (d.t === 'notes') {
            if (d.ts <= notesTsRef.current) return;
            notesTsRef.current = d.ts;
            onOpenChange(true);
            // Don't rip text out from under someone mid-sentence — the next
            // broadcast after they blur/pause reconciles both sides anyway.
            if (!notesFocusedRef.current) setNotesText(d.text);
        }
    }, [paint, clearLocal, onOpenChange]);

    const { send } = useDataChannel(TOPIC, onMessage);
    const broadcast = useCallback(
        (obj) => {
            send(enc.encode(JSON.stringify(obj)), { reliable: true }).catch(() => {});
        },
        [send],
    );

    const broadcastNotes = useCallback((value) => {
        const ts = Date.now();
        notesTsRef.current = ts;
        broadcast({ t: 'notes', text: value, ts });
    }, [broadcast]);

    const onNotesChange = (e) => {
        const value = e.target.value;
        setNotesText(value);
        clearTimeout(notesDebounceRef.current);
        notesDebounceRef.current = setTimeout(() => broadcastNotes(value), NOTES_DEBOUNCE_MS);
    };

    const toggleOpen = () => {
        const next = !open;
        onOpenChange(next);
        broadcast({ t: next ? 'open' : 'close' });
    };

    const clearBoard = () => {
        clearLocal();
        broadcast({ t: 'clear' });
    };

    // Normalised pointer position within the canvas (clamped to the board).
    const pt = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
        return { x, y };
    };

    const strokeAt = (a, b) => {
        const isEraser = tool === 'eraser';
        const s = {
            t: 'seg',
            x0: a.x, y0: a.y, x1: b.x, y1: b.y,
            c: isEraser ? undefined : color,
            w: isEraser ? ERASER_W : SIZES[sizeIdx].w,
            e: isEraser,
        };
        paint(s);
        broadcast(s);
    };

    const onPointerDown = (e) => {
        e.preventDefault();
        try { canvasRef.current.setPointerCapture(e.pointerId); } catch { /* noop */ }
        drawingRef.current = true;
        const p = pt(e);
        lastRef.current = p;
        strokeAt(p, p); // a plain click drops a dot
    };
    const onPointerMove = (e) => {
        if (!drawingRef.current) return;
        const p = pt(e);
        strokeAt(lastRef.current, p);
        lastRef.current = p;
    };
    const onPointerUp = (e) => {
        drawingRef.current = false;
        lastRef.current = null;
        try { canvasRef.current.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    // Reset the cached 2d context if the canvas element is remounted (open/close).
    useEffect(() => {
        ctxRef.current = null;
    }, [open]);

    useEffect(() => () => clearTimeout(notesDebounceRef.current), []);

    // ── panel resize (drag the edge, or jump to a preset) ──
    const onResizeStart = (e) => {
        e.preventDefault();
        const narrow = isNarrowViewport();
        dragStateRef.current = { narrow, startClient: narrow ? e.clientY : e.clientX, startSize: size };
        setDragging(true);
        try { e.target.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onResizeMove = (e) => {
        const st = dragStateRef.current;
        if (!st) return;
        const client = st.narrow ? e.clientY : e.clientX;
        // Panel is docked to the right (or bottom, narrow) edge — dragging its
        // near edge toward the video shrinks it, away from it grows it.
        setSize(clampSize(st.startSize - (client - st.startClient), st.narrow));
    };
    const onResizeEnd = (e) => {
        dragStateRef.current = null;
        setDragging(false);
        try { e.target.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    const applyPreset = (key) => setSize(clampSize(PRESETS[key], isNarrowViewport()));
    const applyFullscreen = () => {
        const narrow = isNarrowViewport();
        const viewportMax = narrow ? window.innerHeight : window.innerWidth;
        setSize(clampSize(viewportMax - VIDEO_RESERVE, narrow));
    };

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={toggleOpen}
                    title="Whiteboard & notes"
                    aria-label="Whiteboard & notes"
                    style={fabBtn(top, right)}
                >
                    <BoardIcon />
                </button>
            )}

            <div
                className={`meet-board-dock${dragging ? ' dragging' : ''}`}
                style={{ '--board-w': `${open ? size : 0}px`, display: open ? 'flex' : 'none' }}
                role="complementary"
                aria-label="Whiteboard and shared notes"
            >
                <div
                    className="meet-board-resize-handle"
                    onPointerDown={onResizeStart}
                    onPointerMove={onResizeMove}
                    onPointerUp={onResizeEnd}
                    onPointerCancel={onResizeEnd}
                    title="Drag to resize"
                />

                <div style={header}>
                    <div style={group}>
                        <ModeBtn active={mode === 'draw'} onClick={() => setMode('draw')} title="Draw">
                            <PenIcon /><span>Draw</span>
                        </ModeBtn>
                        <ModeBtn active={mode === 'notes'} onClick={() => setMode('notes')} title="Notes">
                            <NotesIcon /><span>Notes</span>
                        </ModeBtn>
                    </div>

                    <div style={{ ...group, marginLeft: 'auto' }}>
                        <SizeBtn onClick={() => applyPreset('small')} title="Small">S</SizeBtn>
                        <SizeBtn onClick={() => applyPreset('medium')} title="Medium">M</SizeBtn>
                        <SizeBtn onClick={() => applyPreset('large')} title="Large">L</SizeBtn>
                        <SizeBtn onClick={applyFullscreen} title="Full screen"><ExpandIcon /></SizeBtn>
                    </div>

                    <button type="button" onClick={toggleOpen} style={closeBtn} title="Close" aria-label="Close whiteboard">
                        <CloseIcon />
                    </button>
                </div>

                {mode === 'draw' && (
                    <div style={toolbar}>
                        <div style={group}>
                            <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen">
                                <PenIcon />
                            </ToolBtn>
                            <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser">
                                <EraserIcon />
                            </ToolBtn>
                        </div>
                        <div style={divider} />
                        <div style={group}>
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => { setColor(c); setTool('pen'); }}
                                    title={c}
                                    aria-label={`Colour ${c}`}
                                    style={{
                                        width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
                                        background: c,
                                        border: color === c && tool === 'pen' ? '2px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                                        boxShadow: color === c && tool === 'pen' ? '0 0 0 2px #7567C9' : 'none',
                                    }}
                                />
                            ))}
                        </div>
                        <div style={divider} />
                        <div style={group}>
                            {SIZES.map((s, i) => (
                                <ToolBtn key={i} active={sizeIdx === i} onClick={() => setSizeIdx(i)} title={`Size ${i + 1}`}>
                                    <span style={{ width: s.r, height: s.r, borderRadius: '50%', background: 'currentColor' }} />
                                </ToolBtn>
                            ))}
                        </div>
                        <div style={divider} />
                        <button type="button" onClick={clearBoard} style={textBtn} title="Clear board">
                            Clear
                        </button>
                    </div>
                )}

                <div style={body}>
                    <div className="meet-canvas-wrap" style={{ display: mode === 'draw' ? 'block' : 'none' }}>
                        <canvas
                            ref={canvasRef}
                            width={BW}
                            height={BH}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            style={{
                                width: '100%',
                                height: '100%',
                                touchAction: 'none',
                                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                            }}
                        />
                    </div>
                    <textarea
                        value={notesText}
                        onChange={onNotesChange}
                        onFocus={() => { notesFocusedRef.current = true; }}
                        onBlur={() => {
                            notesFocusedRef.current = false;
                            clearTimeout(notesDebounceRef.current);
                            broadcastNotes(notesText);
                        }}
                        placeholder="Notes both of you can see and edit…"
                        style={{ ...notesArea, display: mode === 'notes' ? 'block' : 'none' }}
                    />
                </div>
            </div>
        </>
    );
}

function ToolBtn({ active, onClick, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            style={{
                width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                border: active ? '1px solid #7567C9' : '1px solid rgba(255,255,255,0.14)',
                background: active ? '#7567C9' : 'rgba(255,255,255,0.06)',
            }}
        >
            {children}
        </button>
    );
}
function ModeBtn({ active, onClick, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-pressed={active}
            style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 11px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                color: '#fff',
                border: active ? '1px solid #7567C9' : '1px solid rgba(255,255,255,0.14)',
                background: active ? '#7567C9' : 'rgba(255,255,255,0.06)',
            }}
        >
            {children}
        </button>
    );
}
function SizeBtn({ onClick, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            style={{
                width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11.5, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
            }}
        >
            {children}
        </button>
    );
}

/* ── icons ── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const BoardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M12 17v3" /><path d="M8 20h8" /><path d="m7 12 3-3 2 2 4-4" />
    </svg>
);
const PenIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);
const EraserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}>
        <path d="m7 21-4-4a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-8 8Z" />
        <path d="M11 8 18 15" /><path d="M7 21h13" />
    </svg>
);
const NotesIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M9 13h6" /><path d="M9 17h4" />
    </svg>
);
const ExpandIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
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
const header = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 14px',
    background: 'rgba(20,20,26,0.98)', borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap',
};
const toolbar = {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    padding: '8px 12px', background: 'rgba(20,20,26,0.94)', borderBottom: '1px solid rgba(255,255,255,0.08)',
};
const group = { display: 'flex', alignItems: 'center', gap: 6 };
const divider = { width: 1, height: 22, background: 'rgba(255,255,255,0.14)' };
const textBtn = {
    height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
    color: '#fff', fontSize: 12.5, fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
};
const closeBtn = {
    width: 30, height: 30, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(239,68,68,0.85)',
};
const body = { position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f6' };
const notesArea = {
    width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none',
    background: '#fff', color: '#1B1830', fontSize: 14, lineHeight: 1.6, padding: 18,
    fontFamily: 'inherit', boxSizing: 'border-box',
};
