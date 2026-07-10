// time-clock-picker.tsx
// A real clock-face time picker (tap hour around the dial, then minute) instead
// of the native OS scroll-wheel <input type="time"> control.
import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeClockPickerProps {
  value: string; // "HH:MM" 24h
  onChange: (v: string) => void;
}

const to12 = (h24: number) => { const h = h24 % 12; return h === 0 ? 12 : h; };

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${to12(h)}:${String(m).padStart(2, '0')} ${period}`;
};

const SIZE = 190;
const CENTER = SIZE / 2;
const RADIUS = 72;

export default function TimeClockPicker({ value, onChange }: TimeClockPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const ref = useRef<HTMLDivElement>(null);

  const [h24raw, mRaw] = value.split(':').map(Number);
  const h24 = Number.isFinite(h24raw) ? h24raw : 9;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = to12(h24);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setMode('hour'); } };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const setHour12 = (h12: number) => {
    const newH24 = (h12 % 12) + (period === 'PM' ? 12 : 0);
    onChange(`${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setMode('minute');
  };
  const setMinute = (mm: number) => {
    onChange(`${String(h24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    setOpen(false);
    setMode('hour');
  };
  const setPeriod = (p: 'AM' | 'PM') => {
    const newH24 = (h24 % 12) + (p === 'PM' ? 12 : 0);
    onChange(`${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const hourNums = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  const minuteNums = Array.from({ length: 12 }, (_, i) => i * 5);
  const nums = mode === 'hour' ? hourNums : minuteNums;
  const selected = mode === 'hour' ? hour12 : (m - (m % 5) === m ? m : -1);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-[var(--c-active)] border border-[var(--c-cardBorder)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--c-text)] hover:bg-[var(--c-cardHover)] transition-colors">
        {fmt(value)}
        <Clock size={15} className="text-[var(--c-textMuted)] shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-[var(--c-card)] text-[var(--c-text)] border border-[var(--c-cardBorder)] rounded-2xl p-4 shadow-2xl w-max">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <button type="button" onClick={() => setMode('hour')}
              className={`text-2xl font-semibold px-1.5 py-0.5 rounded-lg transition-colors ${mode === 'hour' ? 'bg-[var(--c-active)] text-[var(--c-text)]' : 'text-[var(--c-textMuted)]'}`}>
              {String(hour12).padStart(2, '0')}
            </button>
            <span className="text-2xl font-semibold text-[var(--c-textMuted)]">:</span>
            <button type="button" onClick={() => setMode('minute')}
              className={`text-2xl font-semibold px-1.5 py-0.5 rounded-lg transition-colors ${mode === 'minute' ? 'bg-[var(--c-active)] text-[var(--c-text)]' : 'text-[var(--c-textMuted)]'}`}>
              {String(m).padStart(2, '0')}
            </button>
            <div className="flex flex-col ml-2 gap-1">
              <button type="button" onClick={() => setPeriod('AM')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${period === 'AM' ? 'bg-[#7567C9] text-white' : 'text-[var(--c-textMuted)] hover:text-[var(--c-text)]'}`}>AM</button>
              <button type="button" onClick={() => setPeriod('PM')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${period === 'PM' ? 'bg-[#7567C9] text-white' : 'text-[var(--c-textMuted)] hover:text-[var(--c-text)]'}`}>PM</button>
            </div>
          </div>

          <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
            <div className="absolute inset-0 rounded-full bg-[var(--c-active)]" />
            <span className="absolute rounded-full bg-[var(--c-textMuted)]" style={{ left: CENTER - 2, top: CENTER - 2, width: 4, height: 4 }} />
            {nums.map((n, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x = CENTER + RADIUS * Math.cos(angle);
              const y = CENTER + RADIUS * Math.sin(angle);
              const isSel = n === selected;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => (mode === 'hour' ? setHour12(n) : setMinute(n))}
                  className={`absolute flex items-center justify-center size-8 rounded-full text-xs font-medium -translate-x-1/2 -translate-y-1/2 transition-colors ${isSel ? 'bg-[#7567C9] text-white' : 'text-[var(--c-text)] hover:bg-[var(--c-cardHover)]'}`}
                  style={{ left: x, top: y }}
                >
                  {mode === 'minute' ? String(n).padStart(2, '0') : n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
