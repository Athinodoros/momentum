import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTimer,
  minutes,
  startTimer,
  tickTimer,
  pauseTimer,
  resetTimer,
  addTime,
  remainingMs,
  isComplete,
  progress,
  formatClock,
} from '../js/timer.js';

test('minutes converts to ms', () => {
  assert.equal(minutes(5), 300000);
  assert.equal(minutes(0.5), 30000);
});

test('a fresh timer is not running and not complete', () => {
  const t = createTimer(minutes(5));
  assert.equal(t.running, false);
  assert.equal(isComplete(t), false);
  assert.equal(remainingMs(t), minutes(5));
});

test('ticking only advances while running', () => {
  let t = createTimer(minutes(1));
  t = tickTimer(t, 1000); // not started -> no change
  assert.equal(t.elapsedMs, 0);
  t = startTimer(t, 1000);
  t = tickTimer(t, 4000); // 3s elapsed
  assert.equal(t.elapsedMs, 3000);
  assert.equal(remainingMs(t), 57000);
});

test('pause freezes elapsed time', () => {
  let t = startTimer(createTimer(minutes(1)), 0);
  t = tickTimer(t, 10000);
  t = pauseTimer(t, 10000);
  assert.equal(t.running, false);
  // time passes while paused but elapsed does not move
  t = tickTimer(t, 999999);
  assert.equal(t.elapsedMs, 10000);
});

test('timer completes and stops running at duration', () => {
  let t = startTimer(createTimer(minutes(1)), 0);
  t = tickTimer(t, 999999);
  assert.equal(t.elapsedMs, minutes(1));
  assert.equal(isComplete(t), true);
  assert.equal(t.running, false);
  assert.equal(remainingMs(t), 0);
});

test('starting a completed timer is a no-op until reset', () => {
  let t = startTimer(createTimer(minutes(1)), 0);
  t = tickTimer(t, 999999);
  const again = startTimer(t, 1000000);
  assert.equal(again.running, false);
  const fresh = startTimer(resetTimer(t), 2000000);
  assert.equal(fresh.running, true);
  assert.equal(fresh.elapsedMs, 0);
});

test('addTime extends duration but never below elapsed', () => {
  let t = startTimer(createTimer(minutes(1)), 0);
  t = tickTimer(t, 30000); // 30s in
  t = addTime(t, minutes(5));
  assert.equal(t.durationMs, minutes(6));
  const trimmed = addTime(t, -minutes(10)); // would go below elapsed
  assert.equal(trimmed.durationMs, 30000); // clamped to elapsed
});

test('progress is 0..1', () => {
  let t = startTimer(createTimer(minutes(1)), 0);
  assert.equal(progress(t), 0);
  t = tickTimer(t, 30000);
  assert.equal(progress(t), 0.5);
  t = tickTimer(t, 999999);
  assert.equal(progress(t), 1);
});

test('formatClock renders mm:ss, rounding up partial seconds', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(1), '00:01');
  assert.equal(formatClock(59000), '00:59');
  assert.equal(formatClock(60000), '01:00');
  assert.equal(formatClock(305000), '05:05');
});
