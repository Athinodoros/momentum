// Persistence. Pure and backend-agnostic so the same code runs in the browser
// (localStorage) and in Node tests (in-memory). The store never touches the DOM.

export const STORAGE_KEY = 'momentum.state.v1';

/** In-memory backend for tests and SSR. */
export function memoryBackend(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get: (k) => (map.has(k) ? map.get(k) : null),
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
}

/** Wrap a Web Storage object (window.localStorage). */
export function localStorageBackend(ls) {
  return {
    get: (k) => ls.getItem(k),
    set: (k, v) => ls.setItem(k, v),
    remove: (k) => ls.removeItem(k),
  };
}

/**
 * Create a store over a backend.
 * load(fallback) returns parsed state or the fallback when empty/corrupt.
 */
export function createStore(backend, { key = STORAGE_KEY } = {}) {
  return {
    key,
    load(fallback = null) {
      const raw = backend.get(key);
      if (raw == null) return fallback;
      try {
        const parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch {
        return fallback;
      }
    },
    save(state) {
      backend.set(key, JSON.stringify(state));
    },
    clear() {
      backend.remove(key);
    },
  };
}
