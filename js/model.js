// Domain logic for Momentum. Every function is pure: it takes the current state
// and returns a new state, never mutating the input. No DOM, no storage, no
// clock unless `now` is passed in. This is the part the tests exercise hard.

let fallbackCounter = 0;
function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  fallbackCounter += 1;
  return `id-${Date.now().toString(36)}-${fallbackCounter}`;
}

export const CURRENT_VERSION = 1;

export function initialState() {
  return {
    version: CURRENT_VERSION,
    tasks: [],
    wins: [],
    settings: { quickStartMin: 5, defaultFocusMin: 25, lang: null },
  };
}

/**
 * Normalize anything loaded from storage into a valid, current-shape state.
 * Guards against hand-edited or older data so the UI never crashes on load.
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return initialState();
  const base = initialState();
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask).filter(Boolean) : [];
  const wins = Array.isArray(raw.wins) ? raw.wins.filter((w) => w && typeof w.at === 'number') : [];
  return {
    version: CURRENT_VERSION,
    tasks,
    wins,
    settings: { ...base.settings, ...(raw.settings || {}) },
  };
}

function normalizeTask(t) {
  if (!t || typeof t !== 'object') return null;
  const title = String(t.title ?? '').trim();
  if (!title) return null;
  const steps = Array.isArray(t.steps)
    ? t.steps
        .map((s) => {
          const stitle = String(s?.title ?? '').trim();
          if (!stitle) return null;
          return {
            id: s.id || uid(),
            title: stitle,
            minutes: Number.isFinite(s?.minutes) ? s.minutes : 5,
            done: Boolean(s?.done),
            doneAt: typeof s?.doneAt === 'number' ? s.doneAt : null,
          };
        })
        .filter(Boolean)
    : [];
  return {
    id: t.id || uid(),
    title,
    note: String(t.note ?? ''),
    createdAt: Number.isFinite(t.createdAt) ? t.createdAt : Date.now(),
    done: Boolean(t.done),
    doneAt: typeof t.doneAt === 'number' ? t.doneAt : null,
    starred: Boolean(t.starred),
    steps,
  };
}

// --- win log helpers -------------------------------------------------------

function addWin(wins, win) {
  return [...wins, win];
}

function removeLatestWin(wins, pred) {
  for (let i = wins.length - 1; i >= 0; i -= 1) {
    if (pred(wins[i])) {
      const copy = wins.slice();
      copy.splice(i, 1);
      return copy;
    }
  }
  return wins;
}

// --- task operations -------------------------------------------------------

export function createTask(title, opts = {}) {
  return {
    id: uid(),
    title: String(title ?? '').trim(),
    note: opts.note ?? '',
    createdAt: opts.now ?? Date.now(),
    done: false,
    doneAt: null,
    starred: false,
    steps: [],
  };
}

export function addTask(state, title, opts = {}) {
  const task = createTask(title, opts);
  if (!task.title) return state;
  return { ...state, tasks: [...state.tasks, task] };
}

export function removeTask(state, taskId) {
  // Wins stay in the log on purpose: deleting a task should never erase the
  // record that you did something. Finished work is kept.
  return { ...state, tasks: state.tasks.filter((t) => t.id !== taskId) };
}

export function toggleStar(state, taskId) {
  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, starred: !t.starred } : t)),
  };
}

/**
 * "Not this right now." Push a task to the back of the queue by making it the
 * newest, and unpin it so it stops being force-surfaced. Nothing is lost; it
 * just stops being the one thing.
 */
export function deferTask(state, taskId, now = Date.now()) {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, starred: false, createdAt: now } : t,
    ),
  };
}

export function setTaskDone(state, taskId, done, now = Date.now()) {
  let wins = state.wins;
  const tasks = state.tasks.map((t) => {
    if (t.id !== taskId) return t;
    if (done && !t.done) {
      wins = addWin(wins, { id: uid(), kind: 'task', title: t.title, taskId, at: now });
    } else if (!done && t.done) {
      wins = removeLatestWin(wins, (w) => w.kind === 'task' && w.taskId === taskId);
    }
    return { ...t, done, doneAt: done ? now : null };
  });
  return { ...state, tasks, wins };
}

// --- step operations -------------------------------------------------------

export function addStep(state, taskId, title, mins = 5) {
  const stitle = String(title ?? '').trim();
  if (!stitle) return state;
  const step = {
    id: uid(),
    title: stitle,
    minutes: Number.isFinite(Number(mins)) ? Number(mins) : 5,
    done: false,
    doneAt: null,
  };
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, steps: [...t.steps, step] } : t,
    ),
  };
}

export function addSteps(state, taskId, steps) {
  return steps.reduce((acc, s) => addStep(acc, taskId, s.title, s.minutes), state);
}

export function removeStep(state, taskId, stepId) {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) } : t,
    ),
  };
}

export function setStepDone(state, taskId, stepId, done, now = Date.now()) {
  let wins = state.wins;
  const tasks = state.tasks.map((t) => {
    if (t.id !== taskId) return t;
    const steps = t.steps.map((s) => {
      if (s.id !== stepId) return s;
      if (done && !s.done) {
        wins = addWin(wins, { id: uid(), kind: 'step', title: s.title, taskId, stepId, at: now });
      } else if (!done && s.done) {
        wins = removeLatestWin(wins, (w) => w.kind === 'step' && w.stepId === stepId);
      }
      return { ...s, done, doneAt: done ? now : null };
    });
    return { ...t, steps };
  });
  return { ...state, tasks, wins };
}

// --- the core ADHD move: pick exactly ONE next action ----------------------

/**
 * Return { task, step } for the single thing to do right now, or null when
 * nothing is open. Starred tasks win; ties break by oldest-first so the list
 * stays stable and the same thing keeps being surfaced until it's done.
 */
export function pickNextAction(state) {
  const open = state.tasks.filter((t) => !t.done);
  if (open.length === 0) return null;
  const sorted = [...open].sort(
    (a, b) => Number(b.starred) - Number(a.starred) || a.createdAt - b.createdAt,
  );
  const task = sorted[0];
  const step = task.steps.find((s) => !s.done) || null;
  return { task, step };
}

// --- momentum: make progress visible --------------------------------------

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * winsToday, total wins ever, current day-streak, and open task count.
 * Streak counts consecutive days ending today (or yesterday if today has no
 * win yet, so a streak doesn't visibly break until a full empty day passes).
 */
export function momentumStats(state, now = Date.now()) {
  const days = new Set(state.wins.map((w) => dayKey(w.at)));
  const today = dayKey(now);
  const winsToday = state.wins.filter((w) => dayKey(w.at) === today).length;

  const ONE_DAY = 86400000;
  let streak = 0;
  let cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor = new Date(cursor.getTime() - ONE_DAY);
  }
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_DAY);
  }

  return {
    winsToday,
    total: state.wins.length,
    streak,
    openCount: state.tasks.filter((t) => !t.done).length,
  };
}

// --- breakdown scaffolding -------------------------------------------------

/**
 * The English breakdown catalog. Each entry is a keyword matcher plus a tiny
 * set of steps; the last entry has no matcher and is the default. Localized
 * catalogs (see js/i18n.js) follow the same shape.
 */
export const DEFAULT_BREAKDOWNS = [
  {
    match: /\b(email|reply|respond|message|dm|text)\b/i,
    steps: [
      { title: 'Open the thread and read it once', minutes: 2 },
      { title: 'Write a rough reply — ignore polish', minutes: 5 },
      { title: 'Tidy it and hit send', minutes: 3 },
    ],
  },
  {
    match: /\b(write|draft|essay|report|blog|doc|paper|post|article)\b/i,
    steps: [
      { title: 'Dump bullet points, no full sentences', minutes: 5 },
      { title: 'Turn 3 bullets into rough paragraphs', minutes: 15 },
      { title: 'Read once, fix only the worst bits', minutes: 10 },
    ],
  },
  {
    match: /\b(clean|tidy|laundry|dishes|room|desk|kitchen|wash)\b/i,
    steps: [
      { title: 'Set a 10-min timer, grab a bag/bin', minutes: 1 },
      { title: 'Clear one surface only', minutes: 10 },
      { title: 'Put away 5 things, then stop', minutes: 5 },
    ],
  },
  {
    match: /\b(call|phone|book|appointment|dentist|doctor|schedule)\b/i,
    steps: [
      { title: 'Find the number and write it down', minutes: 2 },
      { title: 'Note the one sentence you need to say', minutes: 2 },
      { title: 'Make the call', minutes: 5 },
    ],
  },
  {
    match: /\b(code|bug|fix|feature|refactor|deploy|test)\b/i,
    steps: [
      { title: 'Open the file and find where it lives', minutes: 3 },
      { title: 'Make the smallest change that could work', minutes: 15 },
      { title: 'Run it once and read the output', minutes: 5 },
    ],
  },
  {
    steps: [
      { title: 'Set up — open everything you need', minutes: 2 },
      { title: 'First tiny piece — the smallest visible part', minutes: 5 },
      { title: 'Main chunk — keep going', minutes: 15 },
      { title: 'Finish — check it and close out', minutes: 5 },
    ],
  },
];

/**
 * Suggest a tiny starter breakdown for a task title. Deterministic, offline,
 * no AI needed. The point is to beat activation energy: the first step is
 * always something you can do in a couple of minutes. The user edits from here.
 * Pass a localized catalog to get steps (and keyword matching) in that language.
 */
export function suggestSteps(title = '', catalog = DEFAULT_BREAKDOWNS) {
  const t = String(title);
  for (const entry of catalog) {
    if (!entry.match || entry.match.test(t)) {
      return entry.steps.map((s) => ({ ...s }));
    }
  }
  return [];
}
