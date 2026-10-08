import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCALES,
  isSupported,
  detectLocale,
  getLocale,
  setLocale,
  t,
  cheers,
  breakdownCatalog,
  _messagesFor,
  _breakdownsFor,
} from '../js/i18n.js';
import { suggestSteps } from '../js/model.js';

const CODES = LOCALES.map((l) => l.code);

test('exactly the five requested languages are offered', () => {
  assert.deepEqual(CODES.sort(), ['de', 'el', 'en', 'es', 'fr']);
});

test('every locale defines every key English defines (no missing strings)', () => {
  const enKeys = Object.keys(_messagesFor('en')).sort();
  for (const code of CODES) {
    const keys = Object.keys(_messagesFor(code)).sort();
    assert.deepEqual(keys, enKeys, `locale "${code}" has a different key set`);
  }
});

test('no translated string is accidentally left empty', () => {
  for (const code of CODES) {
    const msgs = _messagesFor(code);
    for (const [key, val] of Object.entries(msgs)) {
      if (key === 'cheers') continue;
      assert.ok(String(val).trim().length > 0, `${code}.${key} is empty`);
    }
  }
});

test('each locale provides 5 cheers', () => {
  for (const code of CODES) {
    assert.equal(_messagesFor(code).cheers.length, 5, `${code} cheers`);
  }
});

test('strings that take placeholders keep them in every locale', () => {
  for (const code of CODES) {
    setLocale(code);
    assert.ok(t('start_just', { min: 5 }).includes('5'), `${code} start_just drops {min}`);
    assert.ok(t('min', { n: 10 }).includes('10'), `${code} min drops {n}`);
    assert.ok(t('left_count', { n: 3 }).includes('3'), `${code} left_count drops {n}`);
    assert.ok(t('aria_delete', { title: 'Zebra' }).includes('Zebra'), `${code} aria_delete drops {title}`);
  }
  setLocale('en');
});

test('t falls back to English for an unknown key, then to the key itself', () => {
  setLocale('de');
  assert.equal(t('this_key_does_not_exist'), 'this_key_does_not_exist');
  setLocale('en');
});

test('detectLocale prefers explicit choice, then browser langs, then English', () => {
  assert.equal(detectLocale('el', ['fr-FR']), 'el'); // explicit wins
  assert.equal(detectLocale(null, ['fr-FR', 'en']), 'fr'); // first supported browser lang
  assert.equal(detectLocale('xx', ['pt-BR']), 'en'); // nothing supported
  assert.equal(detectLocale(undefined, []), 'en');
});

test('setLocale ignores unsupported codes', () => {
  setLocale('de');
  assert.equal(getLocale(), 'de');
  setLocale('klingon');
  assert.equal(getLocale(), 'en');
});

test('every locale breakdown catalog is well-formed with a default last', () => {
  for (const code of CODES) {
    const cat = _breakdownsFor(code);
    assert.ok(Array.isArray(cat) && cat.length >= 2, `${code} catalog`);
    const last = cat[cat.length - 1];
    assert.equal(last.match, undefined, `${code} last entry must be the default`);
    for (const entry of cat) {
      assert.ok(entry.steps.length >= 1, `${code} entry has steps`);
      for (const s of entry.steps) {
        assert.ok(s.title.trim().length > 0 && Number.isFinite(s.minutes), `${code} step shape`);
      }
    }
  }
});

test('localized keyword matching works (German call + Greek clean + French write)', () => {
  setLocale('de');
  const de = suggestSteps('Zahnarzt anrufen', breakdownCatalog());
  assert.match(de[0].title, /Nummer/); // the "call" recipe

  setLocale('el');
  const el = suggestSteps('να καθαρίσω το δωμάτιο', breakdownCatalog());
  assert.match(el[0].title, /χρονόμετρο/); // the "clean" recipe

  setLocale('fr');
  const fr = suggestSteps('rédiger le rapport', breakdownCatalog());
  assert.match(fr[0].title, /puces/); // the "write" recipe

  setLocale('en');
});

test('an unmatched title falls to the localized default breakdown', () => {
  setLocale('es');
  const es = suggestSteps('algo muy vago', breakdownCatalog());
  assert.match(es[0].title, /Preparar/);
  setLocale('en');
});
