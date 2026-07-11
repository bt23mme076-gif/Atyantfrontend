import { useEffect, useState, useCallback } from 'react';

// Pre-call network check. Runs BEFORE the LiveKit room connects and measures
// the user's real connection quality on two levels:
//
// 1. HTTPS latency/jitter/loss (pinging /api/health) — cheap signal, catches
//    generally bad networks.
// 2. A REAL WebRTC/UDP reachability probe against the actual LiveKit media
//    server (187.127.133.111:3478, STUN). This is the one that matters: on
//    2026-07-11 a mobile-data (CGNAT) user's HTTPS ping graded "great" (76ms,
//    0% loss) yet the call never connected — the server sent 8 ICE checks and
//    got 0 responses back, because CGNAT blocks the exact UDP path video
//    needs, which an HTTPS ping can't see at all (HTTPS is TCP, video is UDP).
//    This probe opens a real RTCPeerConnection and checks whether ANY
//    server-reflexive (srflx) UDP candidate comes back — if not, this network
//    cannot carry video no matter how good the HTTPS ping looked, so we grade
//    it "weak" regardless of latency numbers.
//
// It can't force a user onto a better network. What it does is catch this
// BEFORE a paid session starts, so the student switches to WiFi instead of
// paying for a call that will never even connect. Good networks pass both
// checks in ~2-3s.
//
// Fully self-contained + gated by a flag in MeetPage, so it can be turned off
// (or reverted) without touching the call flow.

const PROBE_COUNT = 8;        // number of health pings
const PROBE_TIMEOUT_MS = 3000; // a probe slower than this counts as lost
const UDP_PROBE_TIMEOUT_MS = 4000; // how long to wait for a srflx candidate
// Same server your calls actually use (docker/livekit config: turn.udp_port).
// STUN Binding doesn't need TURN credentials, so this needs no token/signaling.
const STUN_URL = 'stun:187.127.133.111:3478';

// Real UDP/WebRTC reachability check. Resolves true if the browser manages to
// gather a server-reflexive candidate (proof this network can get UDP packets
// to and from your media server) or false if gathering finishes/times out
// with none — the exact signature of the CGNAT/mobile-data failure.
function checkUdpReachability() {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            pc.close();
            resolve(ok);
        };

        let pc;
        try {
            pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_URL }] });
        } catch {
            resolve(false); // WebRTC unavailable — treat as unable to verify
            return;
        }

        const timer = setTimeout(() => finish(false), UDP_PROBE_TIMEOUT_MS);

        pc.onicecandidate = (e) => {
            if (e.candidate && e.candidate.type === 'srflx') finish(true);
        };
        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') finish(false);
        };

        pc.createDataChannel('probe');
        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .catch(() => finish(false));
    });
}

// Thresholds tuned for a video call. avgRtt = latency, jitter = spread between
// probes (instability), loss = probes that timed out. udpOk = false means the
// real media path is blocked — that overrides everything else to "weak",
// since a great ping means nothing if the video transport can't connect.
function classify({ avgRtt, jitter, loss, effectiveType, udpOk }) {
    if (!udpOk) return 'udpBlocked';
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

    // Run the HTTPS probes and the real UDP/media reachability check in
    // parallel — they measure independent things and neither should wait on
    // the other.
    const udpPromise = checkUdpReachability();

    const rtts = [];
    let loss = 0;
    for (let i = 0; i < PROBE_COUNT; i++) {
        const rtt = await probeOnce(url);
        if (rtt === null) loss++;
        else rtts.push(rtt);
    }

    const udpOk = await udpPromise;

    const avgRtt = rtts.length
        ? rtts.reduce((a, b) => a + b, 0) / rtts.length
        : Infinity;
    const jitter = rtts.length > 1
        ? Math.max(...rtts) - Math.min(...rtts)
        : 0;
    const effectiveType = navigator.connection?.effectiveType;

    const grade = classify({ avgRtt, jitter, loss, effectiveType, udpOk });
    return { grade, avgRtt: Math.round(avgRtt), jitter: Math.round(jitter), loss, udpOk };
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
    udpBlocked: {
        color: '#f87171',
        title: 'This network won’t connect for video calls',
        sub: 'Your network is blocking the connection video calls need — this is common on mobile data. Please switch to WiFi before joining; the call will not connect otherwise.',
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
                    <span>Video path: {result.udpOk ? 'reachable' : 'blocked'}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="meet-btn" onClick={onProceed}>
                        {result.grade === 'good' ? 'Join session' : 'Join anyway'}
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
