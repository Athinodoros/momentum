import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryBackend } from '../js/store.js';

test('save then load round-trips state', () => {
  const store = createStore(memoryBackend());
  const state = { tasks: [{ id: '1', title: 'x' }], wins: [] };
  store.save(state);
  assert.deepEqual(store.load(), state);
});

test('load returns fallback when empty', () => {
  const store = createStore(memoryBackend());
  assert.equal(store.load('FB'), 'FB');
});

test('load returns fallback on corrupt JSON', () => {
  const backend = memoryBackend({ 'momentum.state.v1': '{not valid json' });
  const store = createStore(backend);
  assert.equal(store.load('FB'), 'FB');
});

test('clear removes stored state', () => {
  const store = createStore(memoryBackend());
  store.save({ a: 1 });
  store.clear();
  assert.equal(store.load('EMPTY'), 'EMPTY');
});
