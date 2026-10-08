// Browser wiring: render state to the DOM, handle input, drive the focus timer.
// All domain decisions live in model.js; all timer math lives in timer.js.
// This file only connects them to the screen and to localStorage.

import { createStore, localStorageBackend } from './store.js';
import {
  initialState,
  migrate,
  addTask,
  removeTask,
  toggleStar,
  setTaskDone,
  addStep,
  addSteps,
  removeStep,
  setStepDone,
  deferTask,
  pickNextAction,
  momentumStats,
  suggestSteps,
} from './model.js';
import {
  createTimer,
  minutes,
  startTimer,
  pauseTimer,
  tickTimer,
  resetTimer,
  addTime,
  remainingMs,
  isComplete,
  progress,
  formatClock,
} from './timer.js';

// --- state + persistence ---------------------------------------------------

const store = createStore(localStorageBackend(window.localStorage));
let state = migrate(store.load(initialState()));

function commit(next) {
  state = next;
  store.save(state);
  render();
}

// Focus timer lives outside app state (it's ephemeral, not worth persisting).
let timer = null; // null when idle
let timerTarget = null; // { taskId, stepId|null } the timer is counting for
let tickHandle = null;

// --- tiny DOM helper --------------------------------------------------------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v; // only used with trusted static strings
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const $ = (id) => document.getElementById(id);

// --- rendering --------------------------------------------------------------

function render() {
  renderStats();
  renderHero();
  renderTasks();
  renderWins();
}

function renderStats() {
  const s = momentumStats(state, Date.now());
  $('statToday').textContent = s.winsToday;
  $('statStreak').textContent = s.streak;
  $('statOpen').textContent = s.openCount;
}

function renderHero() {
  const hero = $('hero');
  hero.innerHTML = '';
  const next = pickNextAction(state);

  if (!next) {
    hero.className = 'hero is-empty';
    hero.append(
      el('p', { class: 'hero-title', text: 'All clear.' }),
      el('p', { text: 'Nothing open right now. Add something, or go enjoy the gap.' }),
    );
    stopTick();
    timer = null;
    timerTarget = null;
    return;
  }

  hero.className = 'hero';
  const { task, step } = next;

  // If the surfaced action changed, drop any stale timer.
  const targetId = step ? step.id : task.id;
  if (timerTarget && timerTarget.key !== targetId) {
    timer = null;
    timerTarget = null;
    stopTick();
  }

  hero.append(el('p', { class: 'hero-eyebrow', text: step ? 'Starting with' : 'Just this' }));
  hero.append(el('h3', { class: 'hero-title', text: task.title }));

  if (step) {
    hero.append(
      el('div', { class: 'hero-step' }, [
        el('span', { text: step.title }),
        el('span', { class: 'mins', text: `${step.minutes} min` }),
      ]),
    );
  }

  hero.append(renderTimer());
  hero.append(renderHeroActions(task, step));
}

function renderTimer() {
  const wrap = el('div', { class: 'timer', id: 'timerBox' });
  const readoutText = timer ? formatClock(remainingMs(tickNow(timer))) : '05:00';
  wrap.append(el('div', { class: 'timer-readout', id: 'timerReadout', text: readoutText }));
  const bar = el('div', { class: 'progress' }, [
    el('div', { class: 'progress-bar', id: 'timerBar' }),
  ]);
  wrap.append(bar);
  if (timer && isComplete(timer)) wrap.classList.add('is-done');
  // Paint the bar immediately.
  queueMicrotask(() => paintTimer());
  return wrap;
}

function renderHeroActions(task, step) {
  const wrap = el('div', { class: 'hero-actions' });
  const quick = state.settings.quickStartMin || 5;
  const long = state.settings.defaultFocusMin || 25;

  const doneBtn = el('button', {
    class: 'btn btn-accent',
    type: 'button',
    onclick: () => completeCurrent(task, step),
  }, step ? 'Finish step ✓' : 'Mark done ✓');

  if (!timer) {
    wrap.append(
      el('button', {
        class: 'btn btn-primary grow',
        type: 'button',
        onclick: () => beginFocus(quick, task, step),
      }, `Start — just ${quick} min`),
      el('button', {
        class: 'btn btn-ghost',
        type: 'button',
        onclick: () => beginFocus(long, task, step),
      }, `Focus ${long} min`),
      doneBtn,
    );
  } else if (isComplete(timer)) {
    wrap.append(
      el('button', { class: 'btn btn-accent grow', type: 'button', onclick: () => completeCurrent(task, step) }, 'Done ✓'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => beginFocus(quick, task, step) }, `Another ${quick} min`),
    );
  } else if (timer.running) {
    wrap.append(
      el('button', { class: 'btn', type: 'button', onclick: pauseFocus }, 'Pause'),
      el('button', { class: 'btn', type: 'button', onclick: () => extendFocus(5) }, '+5 min'),
      el('button', { class: 'btn btn-accent grow', type: 'button', onclick: () => completeCurrent(task, step) }, step ? 'Finish step ✓' : 'Done ✓'),
    );
  } else {
    wrap.append(
      el('button', { class: 'btn btn-primary grow', type: 'button', onclick: resumeFocus }, 'Resume'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: clearFocus }, 'Reset'),
      doneBtn,
    );
  }

  const skip = el('div', { class: 'hero-actions', style: 'margin-top:.4rem' }, [
    el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => skipCurrent(task) }, 'Not this right now — show me something else'),
  ]);
  const container = el('div', {}, [wrap, skip]);
  return container;
}

function renderTasks() {
  const list = $('taskList');
  list.innerHTML = '';
  const open = state.tasks.filter((t) => !t.done);
  const done = state.tasks.filter((t) => t.done);
  const ordered = [...open, ...done];

  $('tasksEmpty').hidden = ordered.length !== 0;

  for (const task of ordered) {
    list.append(renderTask(task));
  }
}

function renderTask(task) {
  const li = el('li', { class: `task${task.done ? ' is-done' : ''}`, dataset: { id: task.id } });

  const check = el('input', {
    class: 'task-check',
    type: 'checkbox',
    'aria-label': `Mark "${task.title}" done`,
    onchange: (e) => commit(setTaskDone(state, task.id, e.target.checked)),
  });
  check.checked = task.done;

  const title = el('span', { class: 'task-title', text: task.title });

  const row = el('div', { class: 'task-row' }, [check, title]);

  if (task.steps.length) {
    const left = task.steps.filter((s) => !s.done).length;
    row.append(el('span', { class: 'task-badge', text: left ? `${left} left` : 'all steps done' }));
  }

  const star = el('button', {
    class: `icon-btn${task.starred ? ' is-starred' : ''}`,
    type: 'button',
    title: task.starred ? 'Unpin' : 'Pin to top',
    'aria-label': task.starred ? 'Unpin task' : 'Pin task to top',
    onclick: () => commit(toggleStar(state, task.id)),
  }, task.starred ? '★' : '☆');
  row.append(star);

  const del = el('button', {
    class: 'icon-btn',
    type: 'button',
    title: 'Delete',
    'aria-label': `Delete "${task.title}"`,
    onclick: () => commit(removeTask(state, task.id)),
  }, '✕');
  row.append(del);

  li.append(row);

  if (task.steps.length) {
    const steps = el('ul', { class: 'steps' });
    for (const s of task.steps) {
      const sCheck = el('input', {
        type: 'checkbox',
        'aria-label': `Mark step "${s.title}" done`,
        onchange: (e) => commit(setStepDone(state, task.id, s.id, e.target.checked)),
      });
      sCheck.checked = s.done;
      steps.append(
        el('li', { class: `step${s.done ? ' is-done' : ''}` }, [
          sCheck,
          el('span', { text: s.title }),
          el('span', { class: 'mins', text: `${s.minutes}m` }),
          el('button', {
            class: 'icon-btn btn-sm',
            type: 'button',
            'aria-label': 'Remove step',
            title: 'Remove step',
            onclick: () => commit(removeStep(state, task.id, s.id)),
          }, '✕'),
        ]),
      );
    }
    li.append(steps);
  }

  if (!task.done) {
    const tools = el('div', { class: 'task-tools' });
    if (!task.steps.length) {
      tools.append(
        el('button', {
          class: 'btn btn-ghost btn-sm',
          type: 'button',
          onclick: () => commit(addSteps(state, task.id, suggestSteps(task.title))),
        }, '✶ Break it down'),
      );
    }
    tools.append(
      el('button', {
        class: 'btn btn-ghost btn-sm',
        type: 'button',
        onclick: () => addStepPrompt(task),
      }, '+ Add step'),
    );
    li.append(tools);
  }

  return li;
}

function renderWins() {
  const list = $('winList');
  list.innerHTML = '';
  const today = dayKey(Date.now());
  const todays = state.wins.filter((w) => dayKey(w.at) === today).slice().reverse();
  $('winsEmpty').hidden = todays.length !== 0;
  for (const w of todays) {
    list.append(
      el('li', { class: 'win' }, [
        el('span', { class: 'tick', text: '✓' }),
        el('span', { text: w.title }),
        el('span', { class: 'time', text: formatTime(w.at) }),
      ]),
    );
  }
}

// --- focus timer control ----------------------------------------------------

function targetKey(step, task) {
  return step ? step.id : task.id;
}

function beginFocus(mins, task, step) {
  timerTarget = { key: targetKey(step, task) };
  timer = startTimer(createTimer(minutes(mins)), Date.now());
  startTick();
  renderHero();
}

function pauseFocus() {
  if (!timer) return;
  timer = pauseTimer(timer, Date.now());
  stopTick();
  renderHero();
}

function resumeFocus() {
  if (!timer) return;
  timer = startTimer(timer, Date.now());
  startTick();
  renderHero();
}

function extendFocus(mins) {
  if (!timer) return;
  timer = addTime(timer, minutes(mins));
  paintTimer();
}

function clearFocus() {
  timer = null;
  timerTarget = null;
  stopTick();
  renderHero();
}

function completeCurrent(task, step) {
  clearFocus();
  if (step) {
    commit(setStepDone(state, task.id, step.id, true));
  } else {
    commit(setTaskDone(state, task.id, true));
  }
  celebrate();
  toast(randomCheer());
}

function skipCurrent(task) {
  clearFocus();
  commit(deferTask(state, task.id, Date.now()));
  toast('Okay — moved to the back.');
}

// tick loop: update the readout in place without re-rendering the whole hero
function startTick() {
  stopTick();
  tickHandle = setInterval(() => {
    if (!timer) return stopTick();
    timer = tickTimer(timer, Date.now());
    paintTimer();
    if (isComplete(timer)) {
      stopTick();
      onTimerComplete();
    }
  }, 250);
}

function stopTick() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

function tickNow(t) {
  return t.running ? tickTimer(t, Date.now()) : t;
}

function paintTimer() {
  if (!timer) return;
  const readout = $('timerReadout');
  const bar = $('timerBar');
  const box = $('timerBox');
  const shown = tickNow(timer);
  if (readout) readout.textContent = formatClock(remainingMs(shown));
  if (bar) bar.style.width = `${Math.round(progress(shown) * 100)}%`;
  if (box) box.classList.toggle('is-done', isComplete(shown));
}

function onTimerComplete() {
  renderHero();
  celebrate();
  toast("Time's up. That's a real focus block — log it or keep going.");
  beep();
}

// --- small interactions -----------------------------------------------------

function addStepPrompt(task) {
  const title = window.prompt(`Add a step to "${task.title}":`);
  if (!title) return;
  const mins = window.prompt('About how many minutes? (just a guess)', '10');
  const n = Number(mins);
  commit(addStep(state, task.id, title, Number.isFinite(n) && n > 0 ? n : 5));
}

let toastHandle = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => {
    t.hidden = true;
  }, 3200);
}

function celebrate() {
  const hero = $('hero');
  if (!hero) return;
  hero.classList.remove('celebrate');
  void hero.offsetWidth; // restart animation
  hero.classList.add('celebrate');
}

const CHEERS = [
  'Done. That counts.',
  'One down. Momentum.',
  'Nice — that was the hard part.',
  'Logged. Keep the thread going.',
  'That is a win. Take it.',
];
function randomCheer() {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)];
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    /* audio is a nice-to-have; ignore if blocked */
  }
}

// --- date helpers -----------------------------------------------------------

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- data ownership: export / import / clear --------------------------------

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `momentum-backup-${dayKey(Date.now())}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Exported. Your data just left in a file you control.');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!window.confirm('Replace everything currently here with the imported data?')) return;
      commit(migrate(parsed));
      toast('Imported.');
    } catch {
      toast('That file could not be read as Momentum data.');
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!window.confirm('Delete all tasks and wins on this device? This cannot be undone.')) return;
  store.clear();
  state = initialState();
  clearFocus();
  render();
  toast('Cleared.');
}

// --- events -----------------------------------------------------------------

$('captureForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('captureInput');
  const value = input.value;
  // Support pasting several lines at once — one task per line.
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean);
  let next = state;
  for (const line of lines) next = addTask(next, line);
  if (next !== state) commit(next);
  input.value = '';
  input.focus();
});

$('exportBtn').addEventListener('click', exportData);
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importData(file);
  e.target.value = '';
});
$('clearBtn').addEventListener('click', clearAll);

// Keep the clock-dependent view honest if the tab is left open across time.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    if (timer && timer.running) {
      timer = tickTimer(timer, Date.now());
      if (isComplete(timer)) {
        stopTick();
        onTimerComplete();
      } else {
        paintTimer();
      }
    }
    renderStats();
    renderWins();
  }
});

// --- offline support (optional, degrades gracefully) ------------------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline caching is a bonus; the app works without it */
    });
  });
}

render();
