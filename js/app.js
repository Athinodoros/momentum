// Browser wiring: render state to the DOM, handle input, drive the focus timer.
// All domain decisions live in model.js; all timer math lives in timer.js; all
// user-facing text lives in i18n.js. This file only connects them to the screen.

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
  addTime,
  remainingMs,
  isComplete,
  progress,
  formatClock,
} from './timer.js';
import * as i18n from './i18n.js';

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
let timerTarget = null; // { key } the timer is counting for
let tickHandle = null;

// --- tiny DOM helper --------------------------------------------------------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
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
const t = (key, params) => i18n.t(key, params);

// --- static text (HTML attributes) -----------------------------------------

function applyStaticI18n() {
  if (document.documentElement) document.documentElement.lang = i18n.getLocale();
  document.title = t('title');
  const desc = document.querySelector?.('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta_desc'));
  for (const node of document.querySelectorAll?.('[data-i18n]') ?? []) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll?.('[data-i18n-ph]') ?? []) {
    node.setAttribute('placeholder', t(node.dataset.i18nPh));
  }
  for (const node of document.querySelectorAll?.('[data-i18n-aria]') ?? []) {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }
}

function setupLangSelect() {
  const sel = $('langSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (const l of i18n.LOCALES) {
    sel.append(el('option', { value: l.code }, l.label));
  }
  sel.value = i18n.getLocale();
  sel.addEventListener('change', (e) => {
    i18n.setLocale(e.target.value);
    state = { ...state, settings: { ...state.settings, lang: i18n.getLocale() } };
    store.save(state);
    applyStaticI18n();
    render();
  });
}

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
      el('p', { class: 'hero-title', text: t('allclear_title') }),
      el('p', { text: t('allclear_body') }),
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

  hero.append(el('p', { class: 'hero-eyebrow', text: step ? t('eyebrow_step') : t('eyebrow_task') }));
  hero.append(el('h3', { class: 'hero-title', text: task.title }));

  if (step) {
    hero.append(
      el('div', { class: 'hero-step' }, [
        el('span', { text: step.title }),
        el('span', { class: 'mins', text: t('min', { n: step.minutes }) }),
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
  wrap.append(el('div', { class: 'progress' }, [el('div', { class: 'progress-bar', id: 'timerBar' })]));
  if (timer && isComplete(timer)) wrap.classList.add('is-done');
  queueMicrotask(() => paintTimer());
  return wrap;
}

function renderHeroActions(task, step) {
  const wrap = el('div', { class: 'hero-actions' });
  const quick = state.settings.quickStartMin || 5;
  const long = state.settings.defaultFocusMin || 25;

  const doneBtn = el(
    'button',
    { class: 'btn btn-accent', type: 'button', onclick: () => completeCurrent(task, step) },
    step ? t('finish_step') : t('mark_done'),
  );

  if (!timer) {
    wrap.append(
      el('button', { class: 'btn btn-primary grow', type: 'button', onclick: () => beginFocus(quick, task, step) }, t('start_just', { min: quick })),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => beginFocus(long, task, step) }, t('focus_min', { min: long })),
      doneBtn,
    );
  } else if (isComplete(timer)) {
    wrap.append(
      el('button', { class: 'btn btn-accent grow', type: 'button', onclick: () => completeCurrent(task, step) }, t('done')),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => beginFocus(quick, task, step) }, t('another_min', { min: quick })),
    );
  } else if (timer.running) {
    wrap.append(
      el('button', { class: 'btn', type: 'button', onclick: pauseFocus }, t('pause')),
      el('button', { class: 'btn', type: 'button', onclick: () => extendFocus(5) }, t('add5')),
      el('button', { class: 'btn btn-accent grow', type: 'button', onclick: () => completeCurrent(task, step) }, step ? t('finish_step') : t('done')),
    );
  } else {
    wrap.append(
      el('button', { class: 'btn btn-primary grow', type: 'button', onclick: resumeFocus }, t('resume')),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: clearFocus }, t('reset')),
      doneBtn,
    );
  }

  const skip = el('div', { class: 'hero-actions', style: 'margin-top:.4rem' }, [
    el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => skipCurrent(task) }, t('skip_cta')),
  ]);
  return el('div', {}, [wrap, skip]);
}

function renderTasks() {
  const list = $('taskList');
  list.innerHTML = '';
  const open = state.tasks.filter((tk) => !tk.done);
  const done = state.tasks.filter((tk) => tk.done);
  const ordered = [...open, ...done];

  $('tasksEmpty').hidden = ordered.length !== 0;
  for (const task of ordered) list.append(renderTask(task));
}

function renderTask(task) {
  const li = el('li', { class: `task${task.done ? ' is-done' : ''}`, dataset: { id: task.id } });

  const check = el('input', {
    class: 'task-check',
    type: 'checkbox',
    'aria-label': t('aria_mark_done', { title: task.title }),
    onchange: (e) => commit(setTaskDone(state, task.id, e.target.checked)),
  });
  check.checked = task.done;

  const row = el('div', { class: 'task-row' }, [check, el('span', { class: 'task-title', text: task.title })]);

  if (task.steps.length) {
    const left = task.steps.filter((s) => !s.done).length;
    row.append(el('span', { class: 'task-badge', text: left ? t('left_count', { n: left }) : t('all_steps_done') }));
  }

  const starLabel = task.starred ? t('aria_unpin') : t('aria_pin');
  row.append(
    el('button', {
      class: `icon-btn${task.starred ? ' is-starred' : ''}`,
      type: 'button',
      title: starLabel,
      'aria-label': starLabel,
      onclick: () => commit(toggleStar(state, task.id)),
    }, task.starred ? '★' : '☆'),
  );

  const delLabel = t('aria_delete', { title: task.title });
  row.append(
    el('button', {
      class: 'icon-btn',
      type: 'button',
      title: delLabel,
      'aria-label': delLabel,
      onclick: () => commit(removeTask(state, task.id)),
    }, '✕'),
  );

  li.append(row);

  if (task.steps.length) {
    const steps = el('ul', { class: 'steps' });
    for (const s of task.steps) {
      const sCheck = el('input', {
        type: 'checkbox',
        'aria-label': t('aria_step_done', { title: s.title }),
        onchange: (e) => commit(setStepDone(state, task.id, s.id, e.target.checked)),
      });
      sCheck.checked = s.done;
      steps.append(
        el('li', { class: `step${s.done ? ' is-done' : ''}` }, [
          sCheck,
          el('span', { text: s.title }),
          el('span', { class: 'mins', text: t('min_abbrev', { n: s.minutes }) }),
          el('button', {
            class: 'icon-btn btn-sm',
            type: 'button',
            'aria-label': t('aria_remove_step'),
            title: t('aria_remove_step'),
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
          onclick: () => commit(addSteps(state, task.id, suggestSteps(task.title, i18n.breakdownCatalog()))),
        }, t('break_it_down')),
      );
    }
    tools.append(
      el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => addStepPrompt(task) }, t('add_step')),
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
  if (step) commit(setStepDone(state, task.id, step.id, true));
  else commit(setTaskDone(state, task.id, true));
  celebrate();
  toast(randomCheer());
}

function skipCurrent(task) {
  clearFocus();
  commit(deferTask(state, task.id, Date.now()));
  toast(t('toast_skip'));
}

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

function tickNow(timerState) {
  return timerState.running ? tickTimer(timerState, Date.now()) : timerState;
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
  toast(t('toast_timeup'));
  beep();
}

// --- small interactions -----------------------------------------------------

function addStepPrompt(task) {
  const title = window.prompt(t('prompt_add_step', { title: task.title }));
  if (!title) return;
  const mins = window.prompt(t('prompt_minutes'), '10');
  const n = Number(mins);
  commit(addStep(state, task.id, title, Number.isFinite(n) && n > 0 ? n : 5));
}

let toastHandle = null;
function toast(msg) {
  const node = $('toast');
  node.textContent = msg;
  node.hidden = false;
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => {
    node.hidden = true;
  }, 3200);
}

function celebrate() {
  const hero = $('hero');
  if (!hero) return;
  hero.classList.remove('celebrate');
  void hero.offsetWidth; // restart animation
  hero.classList.add('celebrate');
}

function randomCheer() {
  const list = i18n.cheers();
  return list[Math.floor(Math.random() * list.length)];
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
  toast(t('toast_exported'));
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!window.confirm(t('confirm_import'))) return;
      commit(migrate(parsed));
      toast(t('toast_imported'));
    } catch {
      toast(t('toast_import_fail'));
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!window.confirm(t('confirm_clear'))) return;
  store.clear();
  state = initialState();
  clearFocus();
  render();
  toast(t('toast_cleared'));
}

// --- events -----------------------------------------------------------------

$('captureForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('captureInput');
  const lines = input.value.split('\n').map((l) => l.trim()).filter(Boolean);
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
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// --- boot -------------------------------------------------------------------

function navLangs() {
  if (typeof navigator === 'undefined') return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

i18n.setLocale(i18n.detectLocale(state.settings?.lang, navLangs()));
applyStaticI18n();
setupLangSelect();
render();
