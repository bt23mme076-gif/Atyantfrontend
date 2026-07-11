import { useEffect, useState, useCallback } from 'react';

// Pre-call network check. Runs BEFORE the LiveKit room connects and measures
// the user's real connection quality — not raw speed (which lies: a "20 Mbps"
// WiFi can still drop packets and jitter badly), but the two things that
// actually break real-time video: round-trip latency and jitter, plus how many
// probes are lost outright. It does this by pinging the backend /api/health a
// handful of times and looking at the timing spread.
//
// It can't force a user onto a better network. What it does is catch a weak
// connection BEFORE a paid session starts, so the student fixes their WiFi /
// moves closer to the router / reschedules — instead of paying for a laggy call
// and blaming the platform. Good networks just pass through in ~2s.
//
// Fully self-contained + gated by a flag in MeetPage, so it can be turned off
// (or reverted) without touching the call flow.

const PROBE_COUNT = 8;        // number of health pings
const PROBE_TIMEOUT_MS = 3000; // a probe slower than this counts as lost

// Thresholds tuned for a video call. avgRtt = latency, jitter = spread between
// probes (instability), loss = probes that timed out.
function classify({ avgRtt, jitter, loss, effectiveType }) {
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'weak';
    if (loss >= 2 || avgRtt > 400 || jitter > 200) return 'weak';
    if (loss === 1 || avgRtt > 220 || jitter > 110) return 'fair';
    return 'good';
}

async function probeOnce(url) {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
        // cache-buster so we measure the network, not a cached response.
        await fetch(`${url}?_=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
        });
        return performance.now() - start;
    } catch {
        return null; // aborted/failed → counts as a lost probe
    } finally {
        clearTimeout(timer);
    }
}

async function runNetworkTest(apiBase) {
    const url = `${apiBase}/api/health`;
    // Warm-up probe: the first request pays one-time DNS + TLS handshake cost
    // (often 1s+) that has nothing to do with call quality. Measuring it would
    // spike jitter and falsely grade a perfectly good network as "weak", so we
    // fire one throwaway probe first and don't count it.
    await probeOnce(url);

    const rtts = [];
    let loss = 0;
    for (let i = 0; i < PROBE_COUNT; i++) {
        const rtt = await probeOnce(url);
        if (rtt === null) loss++;
        else rtts.push(rtt);
    }

    const avgRtt = rtts.length
        ? rtts.reduce((a, b) => a + b, 0) / rtts.length
        : Infinity;
    const jitter = rtts.length > 1
        ? Math.max(...rtts) - Math.min(...rtts)
        : 0;
    const effectiveType = navigator.connection?.effectiveType;

    const grade = classify({ avgRtt, jitter, loss, effectiveType });
    return { grade, avgRtt: Math.round(avgRtt), jitter: Math.round(jitter), loss };
}

const GRADE_UI = {
    good: {
        color: '#34d399',
        title: 'Your connection looks great',
        sub: 'You’re all set for a smooth session.',
    },
    fair: {
        color: '#fbbf24',
        title: 'Your connection is okay',
        sub: 'It may work, but video could occasionally lag. A stronger WiFi is better if you have one.',
    },
    weak: {
        color: '#f87171',
        title: 'Your connection is weak',
        sub: 'This session will likely lag or freeze. Move closer to your router, switch WiFi, or use a stronger network before joining.',
    },
};

export default function PreCallCheck({ apiBase, onProceed }) {
    const [testing, setTesting] = useState(true);
    const [result, setResult] = useState(null);

    const test = useCallback(() => {
        setTesting(true);
        setResult(null);
        runNetworkTest(apiBase)
            .then((r) => { setResult(r); setTesting(false); })
            .catch(() => {
                // If the test itself errors, don't block the user — let them join.
                setResult({ grade: 'fair', avgRtt: 0, jitter: 0, loss: 0 });
                setTesting(false);
            });
    }, [apiBase]);

    useEffect(() => { test(); }, [test]);

    if (testing) {
        return (
            <div className="meet-screen">
                <div className="meet-card">
                    <div className="meet-spinner" />
                    <div className="meet-card-title">Checking your connection…</div>
                    <div className="meet-card-sub">Testing your network for a smooth call</div>
                </div>
            </div>
        );
    }

    const ui = GRADE_UI[result.grade];
    return (
        <div className="meet-screen">
            <div className="meet-card">
                <div
                    className="meet-badge"
                    style={{ background: `${ui.color}22`, color: ui.color }}
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                </div>
                <div className="meet-card-title">{ui.title}</div>
                <div className="meet-card-sub">{ui.sub}</div>

                <div style={{
                    display: 'flex', gap: 18, justifyContent: 'center',
                    margin: '14px 0 4px', fontSize: 13, opacity: 0.75,
                }}>
                    <span>Latency: {result.avgRtt || '—'} ms</span>
                    <span>Jitter: {result.jitter} ms</span>
                    <span>Loss: {Math.round((result.loss / PROBE_COUNT) * 100)}%</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="meet-btn" onClick={onProceed}>
                        {result.grade === 'weak' ? 'Join anyway' : 'Join session'}
                    </button>
                    <button
                        className="meet-btn"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)' }}
                        onClick={test}
                    >
                        Test again
                    </button>
                </div>
            </div>
        </div>
    );
}
