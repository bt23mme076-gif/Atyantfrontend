// Shared framer-motion variants and hooks for the Atyant Hire pages.

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export const stagger = (gap = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
export const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Types `text` out once mounted (remount to restart).
export function useTypewriter(text, speed = 16, startDelay = 0) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return undefined;
    let id;
    const t = setTimeout(() => {
      id = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(id); return v; } return v + 1; }), speed);
    }, startDelay);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [text, speed, startDelay, reduce]);
  return text.slice(0, n);
}
