import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';

// One shared data-channel topic for all meet whiteboard traffic. `send` from
// useDataChannel(topic, …) auto-attaches this topic to every outgoing packet.
const TOPIC = 'atyant-wb';
const enc = new TextEncoder();
const dec = new TextDecoder();

// Fixed backing-store resolution. Both peers draw into the same 1600×900 buffer
// and coordinates travel normalised (0..1), so strokes land identically on any
// screen size and survive window resizes (CSS scales the canvas, not the buffer).
const BW = 1600;
const BH = 900;

const COLORS = ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#7567C9'];
const SIZES = [{ w: 4, r: 6 }, { w: 8, r: 8 }, { w: 16, r: 11 }];
const ERASER_W = 44;

/**
 * A shared whiteboard both participants can draw and write on. Opening it (or
 * receiving a stroke) opens it for the other side too, so the board is always
 * in sync while it's up. Drawing is broadcast stroke-segment by stroke-segment
 * over the LiveKit data channel (reliable, so nothing is dropped).
 *
 * Note: strokes drawn before a peer opens the board are not back-filled — the
 * board syncs from the moment both sides have it open (which the auto-open on
 * first stroke guarantees for the normal flow).
 */
export default function Whiteboard({ top = 66, right = 14 }) {
    const [open, setOpen] = useState(false);
    const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
    const [color, setColor] = useState(COLORS[0]);
    const [sizeIdx, setSizeIdx] = useState(1);

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const drawingRef = useRef(false);
    const lastRef = useRef(null);
    // Live tool/color/size for use inside stable pointer handlers.
    const cfgRef = useRef({ tool, color, sizeIdx });
    cfgRef.current = { tool, color, sizeIdx };

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
            setOpen(true); // defensive: a stroke always means the board is live
            paint(d);
        } else if (d.t === 'clear') {
            clearLocal();
        } else if (d.t === 'open') {
            setOpen(true);
        } else if (d.t === 'close') {
            setOpen(false);
        }
    }, [paint, clearLocal]);

    const { send } = useDataChannel(TOPIC, onMessage);
    const broadcast = useCallback(
        (obj) => {
            send(enc.encode(JSON.stringify(obj)), { reliable: true }).catch(() => {});
        },
        [send],
    );

    const toggle = () => {
        setOpen((v) => {
            const next = !v;
            broadcast({ t: next ? 'open' : 'close' });
            return next;
        });
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
        const { tool: t, color: c, sizeIdx: si } = cfgRef.current;
        const isEraser = t === 'eraser';
        const s = {
            t: 'seg',
            x0: a.x, y0: a.y, x1: b.x, y1: b.y,
            c: isEraser ? undefined : c,
            w: isEraser ? ERASER_W : SIZES[si].w,
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

    // Reset the cached 2d context if the canvas element is remounted.
    useEffect(() => {
        ctxRef.current = null;
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={toggle}
                title="Whiteboard"
                aria-label="Whiteboard"
                style={{ ...fabBtn(top, right), ...(open ? fabActive : null) }}
            >
                <BoardIcon />
            </button>

            {open && (
                <div style={overlay} role="dialog" aria-label="Shared whiteboard">
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
                                        width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
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
                        <button type="button" onClick={toggle} style={closeBtn} title="Close whiteboard" aria-label="Close whiteboard">
                            <CloseIcon />
                        </button>
                    </div>

                    <div style={boardWrap}>
                        <canvas
                            ref={canvasRef}
                            width={BW}
                            height={BH}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                touchAction: 'none',
                                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                            }}
                        />
                    </div>
                </div>
            )}
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
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
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

/* ── icons ── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const BoardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M12 17v3" /><path d="M8 20h8" /><path d="m7 12 3-3 2 2 4-4" />
    </svg>
);
const PenIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);
const EraserIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke}>
        <path d="m7 21-4-4a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-8 8Z" />
        <path d="M11 8 18 15" /><path d="M7 21h13" />
    </svg>
);
const CloseIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke}>
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
const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 990,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '70px 16px 20px',
    boxSizing: 'border-box',
};
const toolbar = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: 12,
    background: 'rgba(24,24,30,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};
const group = { display: 'flex', alignItems: 'center', gap: 6 };
const divider = { width: 1, height: 24, background: 'rgba(255,255,255,0.14)' };
const textBtn = {
    height: 34, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
    color: '#fff', fontSize: 13, fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
};
const closeBtn = {
    width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(239,68,68,0.85)',
};
const boardWrap = {
    position: 'relative',
    width: 'min(96vw, calc((100vh - 150px) * 16 / 9))',
    aspectRatio: '16 / 9',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden',
};
