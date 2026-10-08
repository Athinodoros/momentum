import { test } from 'node:test';
import assert from 'node:assert/strict';
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
} from '../js/model.js';

const DAY = 86400000;

test('initialState is empty and current-version', () => {
  const s = initialState();
  assert.equal(s.version, 1);
  assert.deepEqual(s.tasks, []);
  assert.deepEqual(s.wins, []);
});

test('addTask appends a trimmed task and ignores blank titles', () => {
  let s = initialState();
  s = addTask(s, '  Buy milk  ');
  assert.equal(s.tasks.length, 1);
  assert.equal(s.tasks[0].title, 'Buy milk');
  s = addTask(s, '   ');
  assert.equal(s.tasks.length, 1);
});

test('addTask does not mutate the input state', () => {
  const s0 = initialState();
  const s1 = addTask(s0, 'x');
  assert.equal(s0.tasks.length, 0);
  assert.equal(s1.tasks.length, 1);
});

test('completing a task logs a win; un-completing removes it', () => {
  let s = addTask(initialState(), 'Taxes');
  const id = s.tasks[0].id;
  s = setTaskDone(s, id, true, 1000);
  assert.equal(s.tasks[0].done, true);
  assert.equal(s.tasks[0].doneAt, 1000);
  assert.equal(s.wins.length, 1);
  assert.equal(s.wins[0].kind, 'task');
  s = setTaskDone(s, id, false, 2000);
  assert.equal(s.tasks[0].done, false);
  assert.equal(s.wins.length, 0);
});

test('deleting a task keeps its win in the log', () => {
  let s = addTask(initialState(), 'Ship it');
  const id = s.tasks[0].id;
  s = setTaskDone(s, id, true, 1000);
  s = removeTask(s, id);
  assert.equal(s.tasks.length, 0);
  assert.equal(s.wins.length, 1); // history is kept
});

test('steps can be added, completed, and removed', () => {
  let s = addTask(initialState(), 'Project');
  const tid = s.tasks[0].id;
  s = addStep(s, tid, 'Step one', 5);
  s = addStep(s, tid, 'Step two', 10);
  assert.equal(s.tasks[0].steps.length, 2);
  const sid = s.tasks[0].steps[0].id;
  s = setStepDone(s, tid, sid, true, 1000);
  assert.equal(s.tasks[0].steps[0].done, true);
  assert.equal(s.wins.filter((w) => w.kind === 'step').length, 1);
  s = removeStep(s, tid, s.tasks[0].steps[1].id);
  assert.equal(s.tasks[0].steps.length, 1);
});

test('addSteps bulk-adds a breakdown', () => {
  let s = addTask(initialState(), 'Clean kitchen');
  const tid = s.tasks[0].id;
  s = addSteps(s, tid, suggestSteps('clean the kitchen'));
  assert.ok(s.tasks[0].steps.length >= 3);
});

test('pickNextAction returns null when nothing is open', () => {
  assert.equal(pickNextAction(initialState()), null);
  let s = addTask(initialState(), 'Only task');
  s = setTaskDone(s, s.tasks[0].id, true);
  assert.equal(pickNextAction(s), null);
});

test('pickNextAction surfaces oldest open task, then starred first', () => {
  let s = initialState();
  s = addTask(s, 'First', { now: 1 });
  s = addTask(s, 'Second', { now: 2 });
  assert.equal(pickNextAction(s).task.title, 'First'); // oldest wins

  const secondId = s.tasks[1].id;
  s = toggleStar(s, secondId);
  assert.equal(pickNextAction(s).task.title, 'Second'); // star jumps the queue
});

test('deferTask sends a task to the back and unpins it', () => {
  let s = initialState();
  s = addTask(s, 'First', { now: 1 });
  s = addTask(s, 'Second', { now: 2 });
  assert.equal(pickNextAction(s).task.title, 'First');
  s = deferTask(s, s.tasks[0].id, 100); // First becomes newest
  assert.equal(pickNextAction(s).task.title, 'Second');

  // a pinned task that gets deferred loses its pin
  s = toggleStar(s, s.tasks[0].id); // star First
  assert.equal(s.tasks[0].starred, true);
  s = deferTask(s, s.tasks[0].id, 200);
  assert.equal(s.tasks[0].starred, false);
});

test('pickNextAction drills into the first incomplete step', () => {
  let s = addTask(initialState(), 'Big thing', { now: 1 });
  const tid = s.tasks[0].id;
  s = addStep(s, tid, 'A', 5);
  s = addStep(s, tid, 'B', 5);
  let next = pickNextAction(s);
  assert.equal(next.step.title, 'A');
  s = setStepDone(s, tid, s.tasks[0].steps[0].id, true);
  next = pickNextAction(s);
  assert.equal(next.step.title, 'B');
});

test('momentumStats counts today and total', () => {
  const now = new Date('2026-10-08T12:00:00').getTime();
  let s = addTask(initialState(), 'A');
  s = setTaskDone(s, s.tasks[0].id, true, now);
  s = addTask(s, 'B');
  s = setTaskDone(s, s.tasks[1].id, true, now - 3 * DAY); // a few days ago
  const stats = momentumStats(s, now);
  assert.equal(stats.winsToday, 1);
  assert.equal(stats.total, 2);
  assert.equal(stats.openCount, 0);
});

test('streak counts consecutive days ending today', () => {
  const now = new Date('2026-10-08T12:00:00').getTime();
  let s = initialState();
  // wins today, yesterday, and the day before -> streak 3
  for (const offset of [0, 1, 2]) {
    s = addTask(s, `day-${offset}`);
    s = setTaskDone(s, s.tasks[s.tasks.length - 1].id, true, now - offset * DAY);
  }
  assert.equal(momentumStats(s, now).streak, 3);
});

test('streak survives today having no win yet (counts from yesterday)', () => {
  const now = new Date('2026-10-08T12:00:00').getTime();
  let s = initialState();
  for (const offset of [1, 2]) {
    s = addTask(s, `day-${offset}`);
    s = setTaskDone(s, s.tasks[s.tasks.length - 1].id, true, now - offset * DAY);
  }
  assert.equal(momentumStats(s, now).streak, 2);
});

test('streak breaks after a full empty day', () => {
  const now = new Date('2026-10-08T12:00:00').getTime();
  let s = initialState();
  s = addTask(s, 'old');
  s = setTaskDone(s, s.tasks[0].id, true, now - 3 * DAY); // gap at day 1 and 2
  assert.equal(momentumStats(s, now).streak, 0);
});

test('suggestSteps always returns at least one tiny first step', () => {
  for (const title of ['reply to Sam', 'write the report', 'clean desk', 'call dentist', 'fix the bug', 'something vague']) {
    const steps = suggestSteps(title);
    assert.ok(steps.length >= 1);
    assert.ok(steps[0].minutes <= 5, `first step for "${title}" should be small`);
    assert.ok(steps[0].title.length > 0);
  }
});

test('migrate repairs partial/corrupt state', () => {
  const repaired = migrate({
    tasks: [
      { title: 'ok', steps: [{ title: 'a step' }] },
      { title: '   ' }, // dropped: blank title
      'garbage', // dropped: not an object
    ],
    wins: [{ at: 123, kind: 'task' }, { kind: 'task' }], // second dropped: no timestamp
    settings: { quickStartMin: 3 },
  });
  assert.equal(repaired.version, 1);
  assert.equal(repaired.tasks.length, 1);
  assert.equal(repaired.tasks[0].steps.length, 1);
  assert.equal(repaired.wins.length, 1);
  assert.equal(repaired.settings.quickStartMin, 3);
  assert.equal(repaired.settings.defaultFocusMin, 25); // default preserved
});

test('migrate on junk returns a clean initial state', () => {
  assert.deepEqual(migrate(null), initialState());
  assert.deepEqual(migrate('nope'), initialState());
});
