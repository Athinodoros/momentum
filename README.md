# Momentum

**Turn overwhelm into one next action.** A private, offline-first focus app built around how an ADHD brain actually works: capture fast, surface *one* thing, shrink it until starting is easy, and make every win visible.

No account. No server. No tracking. Everything lives in your browser on your device.

```
npm start
# open http://localhost:4321
```

That's it — no install step, no dependencies.

---

## Why this exists

For a lot of people, the gap between *knowing* what to do and *doing* it is enormous. A normal to-do list makes it worse: twenty items staring back at you is twenty decisions, and decision #1 is paralysis.

Momentum is shaped around five facts about attention:

1. **Working memory is small.** So the screen shows one thing at a time, big.
2. **Knowing ≠ doing.** So the next action is always a button, never just a note.
3. **Starting is the hardest step.** So the main button is "Start — just 5 min," not "Work on this."
4. **Time feels uniform.** So every step carries a concrete minute estimate.
5. **Dopamine is scarce.** So finishing anything logs a visible win and feeds a streak.

## What it does

- **Brain dump** — capture everything in one box (paste multiple lines, one task each). Get it out of your head first.
- **The one thing** — the app picks a single next action and puts it front and center. Pinned tasks jump the queue; otherwise it's stable oldest-first so the same thing keeps showing until it's done.
- **Break it down** — one click scaffolds any task into tiny timed steps, with a first step you can do in ~2 minutes. The breakdown adapts to the task (email, writing, cleaning, a phone call, a bug). Edit freely.
- **Focus timer** — "just 5 minutes" to beat activation energy, or a longer block. Pause, add 5, or finish early. A gentle chime when time's up.
- **Wins** — every finished step or task is logged with a timestamp. Deleting a task never erases the fact that you did it.
- **"Not this right now"** — defer the current thing without guilt; it slides to the back and something else comes up.

## Your data is yours

- Stored only in this browser's `localStorage`.
- **Export** writes a JSON file you control. **Import** restores it (here or on another device). **Clear all** wipes the device.
- The optional service worker caches the app so it opens with no network. Your tasks never travel through it.

## Project layout

```
index.html          app shell and layout
css/styles.css      calm, high-contrast UI; light + dark via the OS
js/model.js         pure domain logic (tasks, steps, wins, the one-thing picker, streaks, breakdowns)
js/timer.js         focus timer as a pure, injectable-clock state machine
js/store.js         persistence, backend-agnostic (localStorage in the browser, in-memory in tests)
js/app.js           DOM rendering + event wiring (the only file that touches the browser)
tests/              node:test suites for model, timer, and store
server.mjs          zero-dependency static server (so the browser can load ES modules)
sw.js               service worker for offline use
```

The logic is deliberately split from the DOM: `model.js`, `timer.js`, and `store.js` are pure and fully unit-tested; `app.js` is the only browser-coupled file.

## Develop

```
npm test     # run the full suite (Node's built-in test runner, no deps)
npm start    # serve at http://localhost:4321
```

Requires Node 18+ (built-in `node:test` and ES modules). Tested on Node 22.

## License

MIT — see [LICENSE](LICENSE).
