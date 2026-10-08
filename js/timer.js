// A focus timer as a pure state machine. `now` is always injected so the logic
// is deterministic and testable without wall-clock time. The UI feeds it
// Date.now(); tests feed it fixed numbers.

export function createTimer(durationMs) {
  return {
    durationMs: Math.max(0, durationMs | 0),
    elapsedMs: 0,
    running: false,
    lastTickAt: null,
  };
}

export function minutes(mins) {
  return Math.round(mins * 60000);
}

export function startTimer(t, now) {
  if (t.running || isComplete(t)) return t;
  return { ...t, running: true, lastTickAt: now };
}

/** Advance elapsed time by the gap since the last tick. */
export function tickTimer(t, now) {
  if (!t.running) return t;
  const delta = Math.max(0, now - (t.lastTickAt ?? now));
  const elapsedMs = Math.min(t.durationMs, t.elapsedMs + delta);
  const stillRunning = elapsedMs < t.durationMs;
  return { ...t, elapsedMs, lastTickAt: now, running: stillRunning };
}

export function pauseTimer(t, now) {
  if (!t.running) return t;
  const ticked = tickTimer(t, now);
  return { ...ticked, running: false };
}

export function resetTimer(t) {
  return { ...t, elapsedMs: 0, running: false, lastTickAt: null };
}

/** Extend (or, with a negative value, trim) the duration. Never below elapsed. */
export function addTime(t, ms) {
  const durationMs = Math.max(t.elapsedMs, t.durationMs + ms);
  return { ...t, durationMs };
}

export function remainingMs(t) {
  return Math.max(0, t.durationMs - t.elapsedMs);
}

export function isComplete(t) {
  return t.durationMs > 0 && t.elapsedMs >= t.durationMs;
}

export function progress(t) {
  if (t.durationMs === 0) return 1;
  return Math.min(1, t.elapsedMs / t.durationMs);
}

/** mm:ss for a millisecond amount. */
export function formatClock(ms) {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
