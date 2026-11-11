# Atomic Timer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Atomic Timer v1: a speedcubing timer PWA styled after Cubic Timer, desktop-first and phone-ready, with Capacitor Android and iOS projects created alongside it.

**Architecture:**
- `src/core` is plain TypeScript with no DOM or React. It holds the data model, time formatting, stats, the timer state machine and the import/export formats, and is test-driven with Vitest.
- `src/platform` wraps the outside world, each piece behind an interface: Dexie storage, cubing.js scrambles, device APIs, file saving.
- `src/ui` is React 19 + MUI 9. It renders Cubic Timer's tab layout below 1024 px and side-by-side panes at 1024 px and wider.

**Tech Stack:** TypeScript 6.0, Vite 8, React 19, MUI 9 (+ Emotion), Dexie 4 + dexie-react-hooks, cubing.js 0.66, uPlot, vite-plugin-pwa 2, Capacitor 8, Vitest 5 + fake-indexeddb, Playwright 1.65, ESLint 10 + typescript-eslint.

**Spec:** `docs/spec.md`

## Global Constraints

- **Clean-room:** never open, copy or translate source code, strings, images or icons from Cubic Timer or Twisty Timer. Behaviour and file formats come from the spec, this plan and sample exported files only.
- License MIT. The README credits Cubic Timer (hato-ya) and Twisty Timer (Ariovaldo Neto) as inspiration.
- Dependencies must be MIT, Apache, BSD or OFL. cubing.js is used unmodified under MPL-2.0.
- Pin TypeScript to `~6.0.3`, because typescript-eslint requires `<6.1`.
- Use npm, not pnpm.
- Display name `Atomic Timer`, app ID `com.kwiinnn.atomictimer`, repo `kwiinnn/AtomicTimer`.
- `src/core/**` must not import from `src/ui` or `src/platform`, and must not touch `window`, `document` or `indexedDB`.
- Times are stored as integer milliseconds. **In all stats code, a DNF is represented as `Infinity`.**
- Fonts: Quicksand via `@fontsource/quicksand`. Icons: `@mui/icons-material` (Google Material Icons, Apache-2.0).
- All user-facing strings go through `t()` from `src/ui/i18n`, English only for now.
- The Vite `base` comes from `process.env.VITE_BASE ?? '/'`. The Pages build sets `VITE_BASE=/AtomicTimer/`.
- Shared test IDs, used by the UI tasks and Playwright:
  - `timer-display`, `scramble-text`, `scramble-image`
  - `times-list`, `solve-row`
  - `quick-plus2`, `quick-dnf`, `quick-comment`, `quick-delete`
  - `undo-button`
  - `stat-<key>-current` and `stat-<key>-best`, where key is `mo3|ao5|ao12|ao50|ao100|ao1000`
  - `session-picker`, `puzzle-picker`
- Every commit message ends with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Unit tests sit next to the code as `*.test.ts(x)`. End-to-end tests live in `tests/e2e/`.

## Review Focus

1. **Key auto-repeat:** holding Space fires repeated `keydown` events (`repeat: true`). These must not restart the hold timer or toggle anything. Pinned in Task 12, `inputMap.test.ts`.
2. **Typing in a text field:** typing a space, `2`, `d`, `n` or `?` into the comment dialog, manual-entry field or a session-name field must not start the timer or fire shortcuts. Pinned in Task 12 (`inputMap`) and Task 15 (`shortcuts`).
3. **Window loses focus or the page is hidden while holding:** the user alt-tabs, or a phone is locked mid-hold. Holding or ready must fall back to idle (or back to inspecting). A running solve keeps running and timing stays correct. Pinned in Task 5 (`blur`) and Task 12 (visibilitychange → `blur`).
4. **Scramble not ready yet, or changes mid-solve:** big puzzles (sq1, 6x6, 7x7) can take seconds the first time. The solve must store the scramble that was showing **when the timer started**, never the prefetched next one, and timing must not be blocked while a scramble loads. Pinned in Task 12, `solveRecorder.test.ts`.
5. **Malformed or foreign import files:** truncated JSON, the wrong CSV, an empty file or a 100k-solve csTimer file. The user must get a readable error or a summary, never a crash or a half-finished import. Pinned in Task 9 (`parseImport` error cases) and Task 6 (`bulkImport` runs in one transaction).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `.gitignore`, `LICENSE`, `README.md`, `tests/e2e/smoke.spec.ts`, `src/core/sanity.test.ts`

**Interfaces:**
- Produces these npm scripts, which later tasks run:
  - `dev`, `build` (`tsc -b && vite build`), `preview`
  - `test` (`vitest run`), `test:e2e` (`playwright test`)
  - `lint` (`eslint .`), `typecheck` (`tsc -b --noEmit`)

- [ ] **Step 1: Initialize the project.** Install the latest version of every package listed under Tech Stack, plus `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@fontsource/quicksand`, `jsdom`, `@testing-library/react` and `@testing-library/dom`. Pin `typescript@~6.0.3`.
  - `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`
  - `vite.config.ts`:
    - `base` from `VITE_BASE`
    - `optimizeDeps.exclude: ['cubing']` and `worker.format: 'es'` (cubing.js ships module workers)
  - `vitest.config.ts`: environment `node` by default; `*.test.tsx` files use `jsdom` via `environmentMatchGlobs`
  - `playwright.config.ts`:
    - `webServer: npm run build && npm run preview -- --port 4173`, `baseURL: http://localhost:4173`
    - Projects: `desktop` (Desktop Chrome, 1440×900) and `mobile` (Pixel 7)
  - `index.html`: `<title>Atomic Timer</title>`
  - `App.tsx`: renders the text "Atomic Timer"
  - `LICENSE`: MIT with copyright holder "kwiinnn"
  - `README.md`: a one-paragraph description, plus the credits line from Global Constraints

- [ ] **Step 2: Write the sanity tests**

```ts
// src/core/sanity.test.ts
import { expect, test } from 'vitest';
test('vitest runs', () => expect(1 + 1).toBe(2));

// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';
test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Atomic Timer');
});
```

- [ ] **Step 3: Verify the whole toolchain**

Run: `npx playwright install chromium && npm run typecheck && npm run lint && npm test && npm run test:e2e`
Expected: everything passes, including 2 Playwright tests (desktop + mobile).

- [ ] **Step 4: Commit.** Include `docs/` in this first commit.

```bash
git add -A && git commit -m "chore: scaffold Vite + React + MUI project with test tooling"
```

---

### Task 2: Data model and time formatting

**Files:**
- Create: `src/core/model.ts`, `src/core/time.ts`
- Test: `src/core/time.test.ts`

**Interfaces:**
- Produces, in `model.ts`:
  - `PuzzleId`, `Penalty`, `Session`, `Solve`, exactly as in spec §6
  - `type SolveSource = Solve['source']`
  - `PUZZLES: Record<PuzzleId, { label: string; eventId: string; cubingPuzzle: string }>`
  - `PUZZLE_ORDER: PuzzleId[]`
- Produces, in `time.ts`:
  - `effectiveTime(s: { timeMs: number; penalty: Penalty }): number`. +2 adds 2000. DNF returns `Infinity`.
  - `formatTime(ms: number, thousandths?: boolean): string`. Singles are **truncated**. `Infinity` → `'DNF'`.
  - `formatAverage(ms: number, thousandths?: boolean): string`. **Rounds** to the nearest 10 ms (or 1 ms when `thousandths` is on), then formats.
  - `formatSolve(s: { timeMs: number; penalty: Penalty }, thousandths?: boolean): string`
  - `parseTimeInput(input: string): { timeMs: number; penalty: Penalty } | null`

`PUZZLES` values. `eventId` equals the id. Labels and the cubing puzzle each id maps to:

| id | label | cubingPuzzle |
|---|---|---|
| `333` | 3x3 | `3x3x3` |
| `222` | 2x2 | `2x2x2` |
| `444` | 4x4 | `4x4x4` |
| `555` | 5x5 | `5x5x5` |
| `666` | 6x6 | `6x6x6` |
| `777` | 7x7 | `7x7x7` |
| `333oh` | 3x3 OH | `3x3x3` |
| `333bf` | 3x3 BLD | `3x3x3` |
| `444bf` | 4x4 BLD | `4x4x4` |
| `555bf` | 5x5 BLD | `5x5x5` |
| `clock` | Clock | `clock` |
| `minx` | Megaminx | `megaminx` |
| `pyram` | Pyraminx | `pyraminx` |
| `skewb` | Skewb | `skewb` |
| `sq1` | Square-1 | `square1` |

`PUZZLE_ORDER` follows that same row order.

- [ ] **Step 1: Write the failing tests**

```ts
test('formatTime truncates singles', () => {
  expect(formatTime(12345)).toBe('12.34');
  expect(formatTime(12345, true)).toBe('12.345');
  expect(formatTime(999)).toBe('0.99');
  expect(formatTime(62420)).toBe('1:02.42');
  expect(formatTime(3723450)).toBe('1:02:03.45');
  expect(formatTime(Infinity)).toBe('DNF');
});
test('formatAverage rounds', () => {
  expect(formatAverage(12345)).toBe('12.35');
  expect(formatAverage(12344)).toBe('12.34');
  expect(formatAverage(Infinity)).toBe('DNF');
});
test('effectiveTime and formatSolve apply penalties', () => {
  expect(effectiveTime({ timeMs: 10000, penalty: 'plus2' })).toBe(12000);
  expect(effectiveTime({ timeMs: 10000, penalty: 'dnf' })).toBe(Infinity);
  expect(formatSolve({ timeMs: 10000, penalty: 'plus2' })).toBe('12.00+');
  expect(formatSolve({ timeMs: 10000, penalty: 'dnf' })).toBe('DNF');
});
test('parseTimeInput', () => {
  expect(parseTimeInput('1:02.42')).toEqual({ timeMs: 62420, penalty: 'none' });
  expect(parseTimeInput('46.5')).toEqual({ timeMs: 46500, penalty: 'none' });
  expect(parseTimeInput('1234')).toEqual({ timeMs: 12340, penalty: 'none' });   // digits only: last two digits are hundredths
  expect(parseTimeInput('10234')).toEqual({ timeMs: 62340, penalty: 'none' });  // 1:02.34
  expect(parseTimeInput('12.34+')).toEqual({ timeMs: 12340, penalty: 'plus2' });
  expect(parseTimeInput('dnf')).toEqual({ timeMs: 0, penalty: 'dnf' });
  for (const bad of ['', 'abc', '0', '1:75.00']) expect(parseTimeInput(bad)).toBeNull();
});
```

- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/time.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `model.ts` and `time.ts`** using the signatures above.
- [ ] **Step 4: Run the tests again.** Same command. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): data model and time formatting`.

---

### Task 3: Means and averages

**Files:**
- Create: `src/core/stats/average.ts`
- Test: `src/core/stats/average.test.ts`

**Interfaces:**
- Produces:
  - `type DnfRule = 'wca' | 'strict'`
    - `'wca'`: DNFs count as the worst solves and are trimmed first. The average is DNF when DNFs outnumber the trim count.
    - `'strict'`: any DNF in the window makes the average DNF.
  - `trimCount(n: number, trimPct: number): number`. Returns 1 for n = 5 or 12, otherwise `Math.ceil(n * trimPct / 100)`.
  - `meanOf(times: number[]): number`. Untrimmed. Any `Infinity` gives `Infinity`.
  - `averageOf(times: number[], trimPct: number, rule: DnfRule): number`. Inputs are effective times (DNF = `Infinity`). Returns the exact mean, with no rounding.

- [ ] **Step 1: Write the failing tests**

```ts
test('trimCount', () => {
  expect([5, 12, 50, 100, 1000].map(n => trimCount(n, 5))).toEqual([1, 1, 3, 5, 50]);
});
test('ao5 trims best and worst', () => expect(averageOf([1000, 2000, 3000, 4000, 5000], 5, 'wca')).toBe(3000));
test('one DNF is trimmed as worst', () => expect(averageOf([1000, 2000, 3000, 4000, Infinity], 5, 'wca')).toBe(3000));
test('two DNFs in ao5 is DNF', () => expect(averageOf([1000, 2000, 3000, Infinity, Infinity], 5, 'wca')).toBe(Infinity));
test('strict rule: any DNF is DNF', () => expect(averageOf([1000, 2000, 3000, 4000, Infinity], 5, 'strict')).toBe(Infinity));
test('ao50 trims 3 each side', () => {
  const t = Array.from({ length: 50 }, (_, i) => (i + 1) * 1000);
  expect(averageOf(t, 5, 'wca')).toBe(25500);  // mean of 4000..47000
});
test('mo3', () => {
  expect(meanOf([1000, 2000, 3000])).toBe(2000);
  expect(meanOf([1000, 2000, Infinity])).toBe(Infinity);
});
```

- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/stats/average.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `average.ts`.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): WCA mean and trimmed average`.

---

### Task 4: Session stats

**Files:**
- Create: `src/core/stats/session.ts`
- Test: `src/core/stats/session.test.ts`

**Interfaces:**
- Consumes: `averageOf`, `meanOf`, `DnfRule` (Task 3); `effectiveTime` (Task 2); `Solve` (Task 2)
- Produces:
  - `type StatKey = 'mo3' | 'ao5' | 'ao12' | 'ao50' | 'ao100' | 'ao1000'`
  - `STAT_KEYS: StatKey[]`
  - `STAT_WINDOWS: Record<StatKey, number>`, i.e. 3, 5, 12, 50, 100, 1000
  - `interface StatsConfig { trimPct: number; dnfRule: DnfRule }`
  - `interface StatRow { current: number | null; best: number | null }`. `null` means not enough solves. `Infinity` means DNF.
  - `interface SessionStats { count: number; countValid: number; mean: number | null; best: number | null; worst: number | null; rows: Record<StatKey, StatRow>; series: { single: number[]; ao5: (number | null)[]; ao12: (number | null)[] } }`
  - `computeSessionStats(solves: Solve[], cfg: StatsConfig): SessionStats`. Input is chronological. `mean` and `worst` ignore DNFs. `best` is the minimum including DNFs, so it is `Infinity` when every solve is a DNF.
  - `filterToday(solves: Solve[], now: Date): Solve[]`. Uses local calendar day.

Performance requirement: for each window, keep a sorted array of the current window. Each step removes the outgoing time and inserts the incoming one using binary search plus `splice`. Do not re-sort every window.

- [ ] **Step 1: Write the failing tests**

```ts
const mk = (ms: number[], penalties: Record<number, Penalty> = {}) =>
  ms.map((timeMs, i) => ({ id: `${i}`, sessionId: 's', timeMs, penalty: penalties[i] ?? 'none',
    scramble: '', createdAt: i * 60_000, comment: '', source: 'keyboard' }) as Solve);
const cfg = { trimPct: 5, dnfRule: 'wca' } as const;

test('rolling stats over 12 ascending solves', () => {
  const s = computeSessionStats(mk(Array.from({ length: 12 }, (_, i) => (i + 1) * 1000)), cfg);
  expect(s.rows.mo3).toEqual({ current: 11000, best: 2000 });
  expect(s.rows.ao5).toEqual({ current: 10000, best: 3000 });
  expect(s.rows.ao12).toEqual({ current: 6500, best: 6500 });
  expect(s.rows.ao50).toEqual({ current: null, best: null });
  expect([s.count, s.mean, s.best, s.worst]).toEqual([12, 6500, 1000, 12000]);
  expect(s.series.ao5.slice(0, 5)).toEqual([null, null, null, null, 3000]);
});
test('DNF excluded from countValid, mean and worst', () => {
  const s = computeSessionStats(mk([1000, 2000, 3000], { 2: 'dnf' }), cfg);
  expect([s.count, s.countValid, s.mean, s.worst]).toEqual([3, 2, 1500, 2000]);
  expect(s.rows.mo3.current).toBe(Infinity);
});
test('10k solves compute in under 1s', () => {
  const t0 = performance.now();
  computeSessionStats(mk(Array.from({ length: 10_000 }, () => 5000 + Math.random() * 10000)), cfg);
  expect(performance.now() - t0).toBeLessThan(1000);
});
test('filterToday keeps local-day solves only', () => {
  const now = new Date(2026, 10, 11, 0, 30);
  const solves = mk([1000, 2000]);
  solves[0]!.createdAt = new Date(2026, 10, 10, 23, 59).getTime();
  solves[1]!.createdAt = new Date(2026, 10, 11, 0, 1).getTime();
  expect(filterToday(solves, now).map(s => s.id)).toEqual(['1']);
});
```

- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/stats/session.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `session.ts`.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): rolling session statistics`.

---

### Task 5: Timer state machine

**Files:**
- Create: `src/core/timer/machine.ts`
- Test: `src/core/timer/machine.test.ts`

**Interfaces:**
- Consumes: `Penalty` (Task 2)
- Produces:

```ts
type Insp = { startedAt: number; alerted: (8 | 12)[] } | null;
type TimerState =
  | { kind: 'idle' }
  | { kind: 'inspecting'; insp: NonNullable<Insp> }
  | { kind: 'holding'; since: number; insp: Insp }
  | { kind: 'ready'; insp: Insp }
  | { kind: 'running'; startedAt: number; penalty: Penalty }
  | { kind: 'stopped'; timeMs: number; penalty: Penalty };
type TimerEvent = { type: 'press' | 'release' | 'tick'; at: number } | { type: 'cancel' } | { type: 'blur' };
type TimerEffect =
  | { type: 'inspectionAlert'; second: 8 | 12 }
  | { type: 'started'; at: number }
  | { type: 'finished'; timeMs: number; penalty: Penalty }
  | { type: 'cancelled' };
interface TimerConfig { holdMs: number; inspection: boolean }
const INSPECTION = { alertsMs: [8000, 12000], plus2AfterMs: 15000, dnfAfterMs: 17000 } as const;
function initialTimerState(): TimerState;          // { kind: 'idle' }
function step(s: TimerState, e: TimerEvent, cfg: TimerConfig): { state: TimerState; effects: TimerEffect[] };
```

Transitions:

| From | Event | To / effect |
|---|---|---|
| idle | `press` | **holding** with `insp: null` when inspection is off. If `holdMs === 0`, go straight to **ready**. |
| idle | `release` | **inspecting** when inspection is on |
| inspecting | `press` | **holding**, carrying `insp` |
| holding | `tick` with `at - since >= holdMs` | **ready** |
| holding | `release` | **inspecting** if `insp` is set, otherwise **idle** |
| ready | `release` | **running** with `startedAt = at`. Effect `started`. Penalty is `plus2` if `insp` is set and `at - insp.startedAt > 15000`. |
| inspecting, holding or ready (with `insp`) | `tick` | Emit each due alert once. At more than 17000 ms of inspection, go to **stopped** with `{ timeMs: 0, penalty: 'dnf' }` and effect `finished`. |
| running | `press` | **stopped** with `timeMs = at - startedAt`. Effect `finished`. |
| stopped | `release` | **idle**. A `press` in stopped is ignored. |
| inspecting, holding, ready or running | `cancel` | **idle**. Effect `cancelled`. |
| holding or ready | `blur` | **inspecting** if `insp` is set, otherwise **idle** |
| any other state | `blur` | No change |

- [ ] **Step 1: Write the failing tests.** Use a helper `run(events, cfg)` that folds `step` and collects all effects. Test names and assertions:
  - `early release returns to idle`: `press@0`, `release@100` (hold 300) → idle, no effects
  - `hold then release starts`: `press@0`, `tick@300`, `release@350` → running, `startedAt` 350, effects `[{type:'started',at:350}]`
  - `press while running finishes`: … then `press@10350` → stopped with `timeMs` 10000. Then `release@10400` → idle.
  - `press in stopped is ignored`: state stays stopped
  - `cancel while running`: idle, effects end with `{type:'cancelled'}`
  - `holdMs 0 goes straight to ready`
  - `inspection alerts fire once each`: inspection on; `release@0`, `tick@8000`, `tick@8100`, `tick@12000` → exactly `[alert 8, alert 12]`
  - `start after 15s inspection is +2`: `release@0`, `press@15000`, `tick@15300`, `release@15400` → running with penalty `plus2`
  - `inspection over 17s is DNF`: `release@0`, `tick@17001` → stopped `{timeMs:0, penalty:'dnf'}`, plus a `finished` effect
  - `blur while holding resets`: without inspection → idle; with inspection → inspecting with the original `startedAt`
  - `blur while running is ignored`
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/timer`. Expected: FAIL.
- [ ] **Step 3: Implement `machine.ts`** as a pure reducer.
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): timer state machine with WCA inspection`.

---

### Task 6: Settings model and Dexie storage

**Files:**
- Create: `src/core/settings.ts`, `src/platform/storage/types.ts`, `src/platform/storage/dexie.ts`
- Test: `src/core/settings.test.ts`, `src/platform/storage/dexie.test.ts` (starts with `import 'fake-indexeddb/auto'`)

**Interfaces:**
- Consumes: the model (Task 2), `DnfRule` (Task 3)
- Produces, in `settings.ts`:
  - `type PaletteId = 'indigo' | 'teal' | 'red' | 'orange' | 'green' | 'purple' | 'blueGrey' | 'pink'`
  - `interface Settings { version: 1; holdMs: number; inspection: boolean; inspectionAlerts: boolean; thousandths: boolean; manualEntry: boolean; trimPct: number; dnfRule: DnfRule; showSessionStats: boolean; showTodayStats: boolean; discreteGraph: boolean; timerTextScale: number; scrambleTextScale: number; themeMode: 'system' | 'light' | 'dark'; palette: PaletteId; backupReminder: boolean; lastBackupAt: number | null; currentSessionId: string | null }`
  - `DEFAULT_SETTINGS`, with the spec §9 defaults: `holdMs` 300, `inspection` false, `inspectionAlerts` true, `thousandths` false, `manualEntry` false, `trimPct` 5, `dnfRule` 'wca', `showSessionStats` true, `showTodayStats` false, `discreteGraph` false, both text scales 1, `themeMode` 'system', `palette` 'indigo', `backupReminder` true, `lastBackupAt` null, `currentSessionId` null
  - `migrateSettings(raw: unknown): Settings`. Starts from the defaults, overlays only known keys whose type matches, and drops everything else.
- Produces, in `types.ts`, the `AppStorage` interface:
  - `listSessions(): Promise<Session[]>`, sorted by `order`
  - `putSession(s: Session): Promise<void>`
  - `deleteSession(id: string): Promise<void>`, which also deletes that session's solves
  - `listSolves(sessionId: string): Promise<Solve[]>`, sorted by `createdAt` ascending
  - `putSolve(s: Solve): Promise<void>`
  - `deleteSolve(id: string): Promise<Solve | undefined>`, returning the deleted solve so it can be undone
  - `bulkImport(sessions: Session[], solves: Solve[]): Promise<void>`, all in one transaction
  - `getSettings(): Promise<Settings>`, `putSettings(s: Settings): Promise<void>`
  - `exportAll(): Promise<{ sessions: Session[]; solves: Solve[]; settings: Settings }>`
- Produces, in `dexie.ts`:
  - `createDexieStorage(dbName?: string): AppStorage`. The default name is `'atomic-timer'`.
  - Dexie schema v1: `sessions: 'id, order'`, `solves: 'id, sessionId, [sessionId+createdAt]'`, `settings: 'key'` (a single row with key `'app'`)
  - `requestPersistence(): Promise<boolean>`, which wraps `navigator.storage?.persist?.()`
  - All reads go through Dexie inside the `AppStorage` methods, so `useLiveQuery(() => storage.listSolves(id))` re-runs when the data changes

- [ ] **Step 1: Write the failing tests.**
  - `migrateSettings({})` equals `DEFAULT_SETTINGS`
  - `migrateSettings({ holdMs: 550, bogus: 1, inspection: 'yes' })` gives `holdMs` 550, `inspection` false, and no `bogus` key
  - `listSessions` sorts by `order`
  - `listSolves` is ascending even when solves are inserted out of order
  - `deleteSolve` returns the solve, and putting it back restores it
  - `deleteSession` cascades, so `listSolves` returns `[]`
  - `bulkImport` writes 3 sessions and 1,000 solves
  - `getSettings` on an empty database returns `DEFAULT_SETTINGS`
  - Each test uses a unique `dbName`
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/settings.test.ts src/platform/storage`. Expected: FAIL.
- [ ] **Step 3: Implement the three files.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: settings model and IndexedDB storage`.

---

### Task 7: Native JSON backup and import merge

**Files:**
- Create: `src/core/io/types.ts`, `src/core/io/backup.ts`, `src/core/io/merge.ts`
- Test: `src/core/io/backup.test.ts`, `src/core/io/merge.test.ts`

**Interfaces:**
- Consumes: the model (Task 2), `Settings` (Task 6)
- Produces, in `types.ts`:
  - `interface ImportSession { key: string; name: string; puzzle: PuzzleId; order?: number }`
  - `interface ImportSolve { sessionKey: string; timeMs: number; penalty: Penalty; scramble: string; createdAt: number; comment: string; source?: SolveSource }`. When `source` is missing, it becomes `'import'`.
  - `interface ImportBatch { sessions: ImportSession[]; solves: ImportSolve[]; skippedUnsupported: number }`
  - `class ImportError extends Error {}`
- Produces, in `backup.ts`:
  - `toBackupJson(data: { sessions: Session[]; solves: Solve[]; settings: Settings }, now: number): string`
    - Output shape: `{ format: 'atomic-timer', version: 1, exportedAt, sessions, solves, settings }`
  - `parseBackupJson(text: string): ImportBatch`
    - Session `key` is the original session id
    - Settings are ignored on import
    - Throws `ImportError` for invalid JSON, the wrong `format`, an unsupported `version`, or a solve that references an unknown session
- Produces, in `merge.ts`:
  - `mergeImport(existing: { sessions: Session[]; solves: Solve[] }, batch: ImportBatch, newId: () => string): { sessions: Session[]; solves: Solve[]; summary: ImportSummary }`
    - Returns only the **new** sessions and solves
  - `interface ImportSummary { sessionsCreated: number; solvesAdded: number; duplicatesSkipped: number; skippedUnsupported: number }`
  - Merge rules:
    - An imported session reuses an existing session that has the same `name` and `puzzle`. Otherwise a new session is created, with `order` after the current maximum.
    - A solve is a duplicate when the same target session already has, or the batch already added, a solve with equal `createdAt`, `timeMs` and `scramble`.

- [ ] **Step 1: Write the failing tests.**
  - `round trip`: `parseBackupJson(toBackupJson(data))`, merged into an empty database, reproduces every session's (`name`, `puzzle`, `order`) and every solve's fields except `id` and `sessionId`. Solves are grouped under the correctly mapped session.
  - `rejects bad files`: `'{'`, `'{"format":"x"}'` and version 99 each throw `ImportError`
  - `reuses existing session`: same name and puzzle → `sessionsCreated` 0
  - `skips duplicates`: importing the same batch twice gives `solvesAdded` 0 the second time, with `duplicatesSkipped` equal to the batch size
  - `duplicates within one batch`: two identical solves in one batch → 1 added, 1 skipped
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/io`. Expected: FAIL.
- [ ] **Step 3: Implement the three files.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): JSON backup format and duplicate-safe import merge`.

---

### Task 8: Cubic Timer / Twisty Timer formats

**Prerequisite:** the user exports a **backup** file from their Cubic Timer app (Export → Backup) and puts it at `tests/fixtures/private/cubic-backup.csv`. This path is gitignored because it holds personal data. The implementer reads **only that exported file** to confirm the format. Do not consult Cubic Timer source code.

**Files:**
- Create: `src/core/io/cubicTimer.ts`, `src/core/io/fixtures/cubic-backup.sample.csv` (synthetic, written by hand), `src/core/io/fixtures/cubic-external.sample.txt` (synthetic)
- Test: `src/core/io/cubicTimer.test.ts`

**Interfaces:**
- Consumes: `ImportBatch`, `ImportError` (Task 7); `parseTimeInput` (Task 2)
- Produces:
  - `parseCubicBackup(csv: string): ImportBatch`. Each (puzzle, category) pair becomes one session: name = category, puzzle mapped. Rows with unknown puzzle types are counted in `skippedUnsupported`.
  - `toCubicBackup(sessions: Session[], solves: Solve[]): string`
  - `parseCubicExternal(text: string, puzzle: PuzzleId, sessionName: string): ImportBatch`. Reads lines of `"time";"scramble";"ISO-8601 date"`. A time of `DNF` means `penalty: 'dnf'`, `timeMs: 0`.
- **Expected backup format. Confirm it against the user's real file in Step 1:**
  - Header row `"Puzzle","Category","Time(millis)","Date(millis)","Scramble","Penalty","Comment"`, comma-separated and double-quoted
  - Penalty is `0` for none, `1` for +2, `2` for DNF
  - Puzzle codes: `333 222 444 555 666 777 clock mega pyra skewb sq1`, mapped to `333 222 444 555 666 777 clock minx pyram skewb sq1`
  - OH and BLD are *categories* under `333`, so they keep puzzle `333` and the category name. Do not guess `333oh` or `333bf`.
  - If the real file differs, implement what the real file shows, record the observed format in a comment at the top of `cubicTimer.ts`, and keep the synthetic sample consistent with it.

- [ ] **Step 1: Confirm the format.** Open the user's real file and compare its header, penalty codes and puzzle codes with the expected format. Write `cubic-backup.sample.csv` with 6 synthetic rows: 2 puzzles, 3 categories, one +2, one DNF, one comment containing a comma and a quote, and one unknown puzzle code.
- [ ] **Step 2: Write the failing tests**

```ts
test('backup: one session per puzzle+category', () => {
  const b = parseCubicBackup(read('cubic-backup.sample.csv'));
  expect(b.sessions.map(s => [s.name, s.puzzle]).sort()).toEqual(/* the 3 expected pairs */);
  expect(b.solves.find(s => s.comment.includes('"'))?.comment).toBe('nice, "pb"');
  expect(b.skippedUnsupported).toBe(1);
});
test('backup penalties map', () => { /* the +2 row → 'plus2', the DNF row → 'dnf' */ });
test('backup round trip', () => { /* toCubicBackup → parseCubicBackup keeps every field */ });
test('external format', () => {
  const b = parseCubicExternal('"1:02.42";"R U";"2016-06-19T10:37:09.619+01:00"\n"DNF";"";"2016-06-19T10:40:00.000+01:00"', '333', 'Imported');
  expect(b.solves[0]).toMatchObject({ timeMs: 62420, penalty: 'none', scramble: 'R U', createdAt: Date.parse('2016-06-19T10:37:09.619+01:00') });
  expect(b.solves[1]).toMatchObject({ timeMs: 0, penalty: 'dnf' });
});
test('real export parses without unsupported rows', { skip: !existsSync(PRIVATE) }, () => {
  expect(parseCubicBackup(readFileSync(PRIVATE, 'utf8')).solves.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run the tests to confirm they fail.** Run: `npx vitest run src/core/io/cubicTimer.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement `cubicTimer.ts`.** Write a small RFC-4180 CSV reader inside the file: quoted fields, `""` escapes, and CRLF line endings.
- [ ] **Step 5: Run the tests again.** Expected: PASS, including the private-file test when the file is present.
- [ ] **Step 6: Commit.** Add `tests/fixtures/private/` to `.gitignore`. Message: `feat(core): Cubic Timer backup and external import/export`.

---

### Task 9: csTimer import and format detection

**Files:**
- Create: `src/core/io/csTimer.ts`, `src/core/io/detect.ts`, `src/core/io/fixtures/cstimer.sample.json` (synthetic)
- Test: `src/core/io/csTimer.test.ts`, `src/core/io/detect.test.ts`

**Interfaces:**
- Consumes: Tasks 7 and 8
- Produces:
  - `parseCsTimer(json: string): ImportBatch`
    - Top-level keys `session1..N` are arrays of solves: `[[penalty, timeMs, ...phases], scramble, comment, unixSeconds]`
    - Penalty: `0` → none, `2000` → plus2, `-1` → dnf
    - Session names and puzzles come from `properties.sessionData`, a JSON **string** of `{ "<n>": { name, opt: { scrType? } } }`
    - `scrType` mapping: `333`→333, `222so`→222, `444wca`→444, `555wca`→555, `666wca`→666, `777wca`→777, `333oh`→333oh, `333ni`→333bf, `444bld`→444bf, `555bld`→555bf, `clkwca`→clock, `mgmp`→minx, `pyrso`→pyram, `skbso`→skewb, `sqrs`→sq1. Missing or unknown → `333`.
    - The session name defaults to `"csTimer <n>"`
  - `type ImportFormat = 'atomic' | 'cubic-backup' | 'cubic-external' | 'cstimer'`
  - `detectFormat(text: string): ImportFormat | null`
    - JSON with `format: 'atomic-timer'` → `atomic`
    - JSON with a `session1` key → `cstimer`
    - First line starting with `"Puzzle","Category"` → `cubic-backup`
    - First line matching `^"[^"]*";"[^"]*";"[^"]*"$` → `cubic-external`
  - `parseImport(text: string, opts?: { externalPuzzle?: PuzzleId; externalSessionName?: string }): ImportBatch`
    - Dispatches to the right parser
    - Throws `ImportError('Unrecognized file format')` when `detectFormat` returns null
    - Throws `ImportError('This file contains no solves')` for an empty result

- [ ] **Step 1: Write the failing tests.**
  - The csTimer sample (2 sessions, `333oh` + missing `scrType`; one +2, one DNF; a solve with phases) maps to 2 sessions with puzzles `['333oh', '333']`. `createdAt` equals `unixSeconds * 1000`, and phases are ignored.
  - `detectFormat` returns the right format for each of the four samples and for `toBackupJson` output, and `null` for `'hello'`, `''` and `'{}'`
  - `parseImport` errors: `'{'`, `''`, a truncated csTimer JSON and a PNG header string each throw `ImportError`. Never a `TypeError`.
  - Large file: a generated csTimer JSON with 100,000 solves parses in under 2 s
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/core/io`. Expected: FAIL.
- [ ] **Step 3: Implement both files.** Every parser wraps its own `JSON.parse` and field access, and rethrows as `ImportError`.
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(core): csTimer import and format detection`.

---

### Task 10: Scramble service and scramble image

**Files:**
- Create: `src/platform/scramble.ts`, `src/ui/components/ScrambleImage.tsx`
- Test: `src/platform/scramble.test.ts`

**Interfaces:**
- Consumes: `PUZZLES` (Task 2)
- Produces:
  - `interface ScrambleService { next(puzzle: PuzzleId): Promise<string>; prefetch(puzzle: PuzzleId): void }`
  - `createScrambleService(generate?: (eventId: string) => Promise<string>): ScrambleService`
    - The default generator is `(id) => randomScrambleForEvent(id).then(a => a.toString())` from `cubing/scramble`
    - Keeps one prefetched scramble per puzzle. `next()` returns the prefetched one and starts the following one.
  - `<ScrambleImage puzzle={PuzzleId} scramble={string} onClick?={() => void} />`
    - Renders a cubing.js `TwistyPlayer` from `cubing/twisty` with `puzzle: PUZZLES[p].cubingPuzzle`, `experimentalSetupAlg: scramble`, `alg: ''`, `visualization: '2D'`, `controlPanel: 'none'`, `background: 'none'`, `hintFacelets: 'none'`
    - Wrapped in a `data-testid="scramble-image"` box
    - When the scramble changes, update the player's properties instead of recreating it

- [ ] **Step 1: Write the failing tests**, using a fake generator that returns `` `${id}-${n++}` ``:
  - `next('333')` resolves to `'333-0'`
  - A second `next('333')` resolves to `'333-1'` without a new call being in flight first (prefetch)
  - `next('333oh')` calls the generator with `'333oh'`
  - If the generator rejects, `next` rejects and the following call retries
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/platform/scramble.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the service and the component.**
- [ ] **Step 4: Run the tests again.** Expected: PASS. Then run `npm run build`. Expected: success, with the cubing worker chunks emitted.
- [ ] **Step 5: Commit** with message `feat: cubing.js scramble service and 2D scramble image`.

---

### Task 11: App shell, theme, layout and sessions

**Files:**
- Create:
  - `src/ui/i18n/en.ts`, `src/ui/i18n/index.ts`
  - `src/ui/theme/palettes.ts`, `src/ui/theme/makeTheme.ts`
  - `src/ui/state/AppContext.tsx`
  - `src/ui/layout/Shell.tsx`, `src/ui/layout/MobileTabs.tsx`, `src/ui/layout/DesktopPanes.tsx`, `src/ui/layout/NavDrawer.tsx`, `src/ui/layout/TopBar.tsx`
  - `src/ui/sessions/SessionPicker.tsx`, `src/ui/sessions/PuzzlePicker.tsx`, `src/ui/sessions/SessionDialogs.tsx`
- Modify: `src/ui/App.tsx`, `src/main.tsx`
- Test: `src/ui/theme/palettes.test.ts`, `tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `AppStorage` (Task 6), `ScrambleService` (Task 10), `Settings` (Task 6)
- Produces:
  - `t(key: keyof typeof en, vars?: Record<string, string | number>): string`
  - `PALETTES: Record<PaletteId, { primary: string; secondary: string }>`
  - `makeTheme(mode: 'light' | 'dark', palette: PaletteId): Theme`. The font is Quicksand. The toolbar is coloured with the primary colour (Material 2 style).
  - `useApp()`, returning:
    - `storage`, `scrambles`, `settings`, `updateSettings(patch: Partial<Settings>): Promise<void>`
    - `sessions: Session[]`, `session: Session | undefined`, `solves: Solve[]` (live, via `useLiveQuery`)
    - `selectSession(id: string): void`
    - `timerBusy: boolean`, `setTimerBusy(b: boolean): void`
    - `view: 'timer' | 'settings' | 'about'`, `setView(v): void`
  - `<Shell timer={ReactNode} times={ReactNode} stats={ReactNode} />`
    - Below 1024 px (`useMediaQuery('(min-width:1024px)')` is false): Timer/Times/Stats tabs in a horizontal CSS scroll-snap container (swipeable, kept in sync with MUI `Tabs`)
    - At 1024 px and wider: center pane = timer; right sidebar (360 px) = session picker, times list and stats
  - Exported dialog-open functions, used by the shortcuts in Task 15: `openPuzzlePicker()` and `openSessionPicker()`, via context
  - First run: if there are no sessions, create `{ name: 'Session 1', puzzle: '333', order: 0 }` and select it
  - Switching sessions is disabled while `timerBusy` is true
  - `SessionDialogs`: create, rename, and delete with a confirmation dialog

- [ ] **Step 1: Write the failing tests.**
  - Unit: every `PaletteId` has a palette, and the contrast of white text on `primary` is at least 4.5
  - e2e `shell.spec.ts`:
    - desktop project: `times-list` and `timer-display` are both visible with no tab clicks
    - mobile project: the tabs `Timer`, `Times` and `Stats` are visible, and clicking `Times` shows `times-list`
    - First load shows `session-picker` with the text "Session 1"
    - Creating a session "OH" with puzzle "3x3 OH" switches to it, and it survives a page reload
    - Deleting a session requires confirmation
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/ui/theme && npm run test:e2e -- shell`. Expected: FAIL.
- [ ] **Step 3: Implement.** The timer, times and stats panes can be placeholders carrying their test IDs; Tasks 12–14 fill them in. The drawer has Timer, Theme, Import/Export, Settings and About entries; Theme and Import/Export can be disabled until their tasks are done. `themeMode: 'system'` follows `prefers-color-scheme`.
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): app shell, Material theme, responsive layout, sessions`.

---

### Task 12: Timer screen

**Files:**
- Create:
  - `src/ui/hooks/keyboard.ts`
  - `src/ui/timer/inputMap.ts`, `src/ui/timer/useTimer.ts`, `src/ui/timer/solveRecorder.ts`
  - `src/ui/timer/TimerPane.tsx`, `src/ui/timer/TimerDisplay.tsx`, `src/ui/timer/ScrambleBox.tsx`, `src/ui/timer/QuickActions.tsx`, `src/ui/timer/ManualEntry.tsx`
  - `src/ui/timer/alerts.ts`
  - `src/platform/device.ts` (web-only for now; Task 19 adds the Capacitor branches)
- Test: `src/ui/hooks/keyboard.test.ts`, `src/ui/timer/inputMap.test.ts`, `src/ui/timer/solveRecorder.test.ts`, `tests/e2e/timer.spec.ts`

**Interfaces:**
- Consumes: `step`, `TimerState`, `TimerEvent` (Task 5); `ScrambleService` and `ScrambleImage` (Task 10); `useApp` (Task 11); `parseTimeInput`, `formatTime` and `formatSolve` (Task 2)
- Produces:
  - `isTypingTarget(t: EventTarget | null): boolean`. True for input, textarea, select, contenteditable, and anything inside `[role=dialog]`.
  - `keyToTimerEvent(e: { type: 'keydown' | 'keyup'; key: string; repeat: boolean; target: EventTarget | null }, state: TimerState, at: number): TimerEvent | null`
  - `pointerToTimerEvent(e: { type: 'pointerdown' | 'pointerup' | 'pointercancel'; isPrimary: boolean; button: number }, at: number): TimerEvent | null`
  - `createSolveRecorder(deps: { scrambles: ScrambleService; save: (s: Solve) => Promise<void>; newId: () => string; now: () => number })`, returning:
    - `{ current(): string | null; load(puzzle: PuzzleId): Promise<void>; onStarted(): void; onFinished(sessionId: string, timeMs: number, penalty: Penalty, source: SolveSource): Promise<Solve> }`
    - `onStarted()` freezes the scramble that is currently showing
    - `onFinished` saves the solve with that frozen scramble (or `''` if none had loaded), then loads the next scramble
  - `useTimer(cfg: TimerConfig, handlers: { onStarted(): void; onFinished(timeMs: number, penalty: Penalty): void; onAlert(second: 8 | 12): void })`, returning `{ state: TimerState; displayRef: RefObject<HTMLElement>; pointerHandlers }`
    - Keyboard listeners on `window`; `blur` and `visibilitychange` (hidden) dispatch `{ type: 'blur' }`
    - A `requestAnimationFrame` loop dispatches `tick` and writes the running time, or the inspection countdown, straight to `displayRef.current.textContent`, with no React state per frame
  - `device.ts`: `setKeepAwake(on: boolean): Promise<void>` (Screen Wake Lock API) and `vibrate(ms: number): void`
  - `alerts.ts`: `playInspectionAlert(second: 8 | 12, opts: { sound: boolean })`. Plays a Web Audio beep (a single beep at 8 s, a double beep at 12 s) and calls `vibrate`.

Input mapping rules:

| Input | Timer event | Condition |
|---|---|---|
| Any key event with `repeat` true | none | |
| Any key event whose target is a typing target | none | |
| Space `keydown` | `press` | |
| Space `keyup` | `release` | |
| Any other `keydown` | `press` | only while `running` |
| `Escape` | `cancel` | |
| `pointerdown` | `press` | primary pointer only, `button === 0` |
| `pointerup` | `release` | primary pointer only |
| `pointercancel` | `blur` | |

Pointer handlers attach to the timer pane only, not to the toolbar or the scramble box.

UI behaviour:
- `TimerDisplay` (`data-testid="timer-display"`):
  - Holding shows the time in red; ready shows it in green
  - While running, the shell sets `data-timing="true"` on `<body>`, and CSS hides everything except the display
  - After a solve, it shows `formatSolve` of the last solve
- `QuickActions` (`quick-plus2`, `quick-dnf`, `quick-comment`, `quick-delete`) act on the last solve and appear after a solve
- Tapping `ScrambleImage` opens a dialog showing it at full width
- Inspection alerts play only when `settings.inspectionAlerts` is on
- `ScrambleBox` (`scramble-text`):
  - Tapping it loads the next scramble
  - Font size scales with `scrambleTextScale`
  - While the first scramble loads, it shows "Generating scramble…"
- When `settings.manualEntry` is on, `ManualEntry` replaces the timer display. Enter submits through `parseTimeInput`, and an invalid entry shows an inline error.
- Keep-awake is turned on from `started` until `finished` or `cancelled`
- `setTimerBusy` is true whenever the state is not `idle` and not `stopped`

- [ ] **Step 1: Write the failing unit tests**

```ts
test('auto-repeat ignored', () => expect(keyToTimerEvent({ type: 'keydown', key: ' ', repeat: true, target: null }, idle, 0)).toBeNull());
test('typing target ignored', () => { const i = document.createElement('input'); expect(keyToTimerEvent({ type: 'keydown', key: ' ', repeat: false, target: i }, idle, 0)).toBeNull(); });
test('space press/release', () => { /* keydown → {type:'press',at}, keyup → {type:'release',at} */ });
test('any key stops only while running', () => { /* 'a' in running → press; 'a' in idle → null */ });
test('escape cancels', () => { /* → {type:'cancel'} */ });
test('non-primary pointer ignored', () => expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: false, button: 0 }, 0)).toBeNull());
// solveRecorder
test('solve keeps scramble shown at start, not the next one', async () => {
  // fake scrambles return 'A' then 'B'. Call load → current() 'A'; onStarted(); load('333') again → current() 'B';
  // onFinished(...) saves a solve whose scramble is 'A'
});
test('solve before first scramble resolves saves empty scramble', async () => { /* the generator never resolves → saved scramble is '' */ });
```

`keyboard.test.ts` and `inputMap.test.ts` use the jsdom environment.

- [ ] **Step 2: Write the failing e2e tests (`timer.spec.ts`, desktop project)**
  - `keyboard solve`:
    - Press Space down, wait 400 ms, release; wait 1,000 ms; press Space
    - `solve-row` count becomes 1, and `stat-mo3-current` still shows `–` (only one solve)
  - `early release does not start`: hold Space for 100 ms → `timer-display` still reads `0.00`
  - `scramble advances after a solve`: the `scramble-text` value differs before and after a solve
  - `typing in comment does not start timer`:
    - Open the comment dialog via `quick-comment`, type `"good one"`, save
    - No new solve appears, and the comment is saved
  - `mobile tap solve` (mobile project): touch-and-hold on the timer pane for 400 ms, release; tap again → 1 solve
- [ ] **Step 3: Run the tests to confirm they fail.** Run: `npx vitest run src/ui && npm run test:e2e -- timer`. Expected: FAIL.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run the tests again.** Expected: PASS.
- [ ] **Step 6: Commit** with message `feat(ui): timer screen with inspection, quick actions, manual entry`.

---

### Task 13: Times list, solve details and undo

**Files:**
- Create: `src/ui/times/TimesList.tsx`, `src/ui/times/SolveSheet.tsx`, `src/ui/times/CommentDialog.tsx`, `src/ui/components/UndoSnackbar.tsx`
- Modify: `src/ui/timer/QuickActions.tsx` (delete with undo, and the shared `CommentDialog`)
- Test: `tests/e2e/times.spec.ts`

**Interfaces:**
- Consumes: `useApp` (Task 11); `formatSolve` and `formatTime` (Task 2); `AppStorage.deleteSolve` and `putSolve` (Task 6)
- Produces:
  - `useUndo()`, returning `{ showUndo(message: string, undo: () => Promise<void>): void }`. Shows a snackbar for 6 s with `undo-button`. A new call replaces any previous snackbar.
  - `<CommentDialog solve onClose />`
  - `<TimesList />` (`times-list`)
    - Newest solve first; each row is a `solve-row` showing `formatSolve` and a comment icon
    - A responsive grid on mobile and a single column in the desktop sidebar
    - Virtualized with CSS `content-visibility: auto` on rows (no extra library)
  - `<SolveSheet />`
    - An MUI bottom sheet (`Drawer anchor="bottom"`) on mobile and a dialog on desktop
    - Shows time, date, scramble (with `ScrambleImage`), comment, penalty toggles and delete

- [ ] **Step 1: Write the failing e2e tests**
  - `penalty toggle`: after a solve, `quick-plus2` changes the newest row text to end with `+`, and clicking it again removes the `+`
  - `delete and undo`: `quick-delete` → `solve-row` count is 0 → `undo-button` → count is back to 1, with the same time text
  - `solve sheet`: clicking a `solve-row` opens a sheet showing its scramble text; DNF in the sheet makes the row show `DNF`
  - `comment persists after reload`
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npm run test:e2e -- times`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): times list, solve details, undo`.

---

### Task 14: Stats panel and graph

Load the `dataviz` skill before writing the chart.

**Files:**
- Create: `src/ui/stats/StatsTable.tsx`, `src/ui/stats/TimeGraph.tsx`, `src/ui/stats/StatsPane.tsx`
- Test: `tests/e2e/stats.spec.ts`

**Interfaces:**
- Consumes: `computeSessionStats`, `filterToday`, `STAT_KEYS` and `SessionStats` (Task 4); `formatAverage` and `formatTime` (Task 2); `useApp`
- Produces:
  - `<StatsTable stats={SessionStats} title={string} />`
    - Rows mo3 to ao1000; columns Current and Best, with cells `stat-<key>-current` and `stat-<key>-best`
    - `null` → `–`; values use `formatAverage`
    - Above the table: solve count (valid/total), mean, best and worst
  - `<TimeGraph stats={SessionStats} discrete={boolean} />`
    - uPlot with series single, ao5 and ao12, using theme colours
    - Discrete mode draws points only
    - DNF and `null` values are drawn as gaps
  - `StatsPane`:
    - Session table when `showSessionStats` is on; a "Today" table when `showTodayStats` is on; then the graph
    - `computeSessionStats` is memoized on `[solves, trimPct, dnfRule]`
    - The graph section is collapsible; its open/closed state is kept in `localStorage`

- [ ] **Step 1: Write the failing e2e test.** Seed IndexedDB through a test-only `window.__seed(solves)` helper, exposed only when `import.meta.env.MODE !== 'production'` or `?e2e=1`. Seed the 12 solves 1.00–12.00, then assert:
  - `stat-ao5-current` = `10.00`, `stat-ao5-best` = `3.00`, `stat-ao12-current` = `6.50`, `stat-ao50-current` = `–`
  - After setting solve #10 to DNF: `stat-ao5-current` = `10.67` (mean of 9, 11 and 12, rounded; the 8 and the DNF are trimmed)
  - The graph canvas is visible
- [ ] **Step 2: Run the test to confirm it fails.** Run: `npm run test:e2e -- stats`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the test again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): statistics table and time graph`.

---

### Task 15: Keyboard shortcuts

**Files:**
- Create: `src/ui/hooks/shortcuts.ts`, `src/ui/components/ShortcutOverlay.tsx`
- Test: `src/ui/hooks/shortcuts.test.ts`, `tests/e2e/shortcuts.spec.ts`

**Interfaces:**
- Consumes: `isTypingTarget` (Task 12); `useUndo` (Task 13); the picker openers (Task 11)
- Produces:
  - `type ShortcutAction = 'plus2' | 'dnf' | 'comment' | 'deleteLast' | 'nextScramble' | 'puzzlePicker' | 'sessionPicker' | 'help'`
  - `keyToShortcut(e: { key: string; repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; target: EventTarget | null }, timerBusy: boolean): ShortcutAction | null`
  - `useShortcuts()` dispatches the actions
  - `<ShortcutOverlay />` opens with `?` and lists the table in spec §9

Key map: `2` → plus2, `d`/`D` → dnf, `c`/`C` → comment, `Delete` → deleteLast, `n`/`N`/`ArrowRight` → nextScramble, `p`/`P` → puzzlePicker, `s`/`S` → sessionPicker, `?` → help.

Returns `null` when `timerBusy` is true, when a typing target is focused, when the key is a repeat, or when Ctrl, Meta or Alt is held (so browser shortcuts still work).

- [ ] **Step 1: Write the failing tests.**
  - Unit: every key in the map, plus `null` for each of the four exclusions. Specifically `'2'` with `ctrlKey` → null, and `'d'` inside a textarea → null.
  - e2e:
    - After a solve, pressing `2` adds `+` to the row
    - `Delete` then `undo-button` restores the solve
    - `N` changes `scramble-text`
    - `?` shows the overlay
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npx vitest run src/ui/hooks && npm run test:e2e -- shortcuts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): keyboard shortcuts and help overlay`.

---

### Task 16: Settings, theme picker and About

**Files:**
- Create: `src/ui/settings/SettingsPage.tsx`, `src/ui/settings/ThemeDialog.tsx`, `src/ui/about/AboutPage.tsx`
- Test: `tests/e2e/settings.spec.ts`

**Interfaces:**
- Consumes: `useApp().settings` and `updateSettings` (Task 11); `PALETTES` (Task 11)
- Produces:
  - `SettingsPage` covers every v1 setting in spec §9, grouped Timer / Inspection / Statistics / Appearance / Backup:
    - `holdMs`: slider, 0–1000 ms in steps of 50
    - `trimPct`: select 0, 5 or 10
    - `dnfRule`: radio buttons "Count DNF as worst (WCA)" / "Any DNF makes average DNF"
    - Text scales: slider, 0.5–2
  - `ThemeDialog`:
    - Mode selector (System / Light / Dark)
    - One colour card for each palette, with a preview swatch and the toolbar colour
  - `AboutPage`:
    - App version from `package.json`
    - MIT license
    - Credits to Cubic Timer and Twisty Timer
    - Third-party notices for cubing.js (MPL-2.0, with a link to its source), MUI, Dexie, Quicksand (OFL) and Material Icons

- [ ] **Step 1: Write the failing e2e tests.**
  - Turning on Inspection and returning to the timer, then pressing and releasing Space, makes `timer-display` show a countdown starting at `15`
  - Turning on Thousandths makes a new solve show 3 decimals
  - Choosing the Dark theme and the Teal palette survives a reload (body background is dark)
  - About contains "Cubic Timer" and "MPL-2.0"
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npm run test:e2e -- settings`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): settings, theme picker, about`.

---

### Task 17: Import/export UI and backup reminder

**Files:**
- Create: `src/platform/files.ts`, `src/ui/io/ImportExportPage.tsx`, `src/ui/io/BackupReminder.tsx`, `tests/e2e/fixtures/` (copies of the synthetic samples)
- Test: `tests/e2e/io.spec.ts`

**Interfaces:**
- Consumes:
  - `parseImport`, `detectFormat` and `ImportError` (Task 9)
  - `mergeImport` and `ImportSummary` (Task 7)
  - `toBackupJson` (Task 7) and `toCubicBackup` (Task 8)
  - `AppStorage.bulkImport` and `exportAll`, plus `requestPersistence` (Task 6)
- Produces:
  - `saveTextFile(name: string, text: string, mime: string): Promise<void>`. On the web it downloads a Blob through a temporary `<a download>`. Task 19 adds the native branch.
  - `ImportExportPage`:
    - **Import:** pick a file. Detect its format. If it is `cubic-external`, ask which puzzle and session name to use. Then parse, merge with existing data and run `bulkImport`. Finally show a summary dialog: "N sessions created, M solves added, K duplicates skipped, U unsupported rows skipped". `ImportError` messages are shown in an error dialog, and nothing is written.
    - **Export:** "Backup (JSON)" → `atomic-timer-YYYY-MM-DD.json`; "Cubic Timer CSV" → `atomic-timer-cubic-YYYY-MM-DD.csv`. Both set `lastBackupAt`.
  - `BackupReminder`: on startup, if `backupReminder` is on, there are more than 0 solves, and `lastBackupAt` is null or more than 30 days old, show a snackbar "Back up your times" with an action that opens Import/Export. Startup also calls `requestPersistence()` once.

- [ ] **Step 1: Write the failing e2e tests.**
  - Importing `cstimer.sample.json` shows a summary with "2 sessions created", and both sessions appear in `session-picker`
  - Importing the same file again → "0 solves added"
  - Importing `garbage.txt` shows an "Unrecognized file format" error, and the session count is unchanged
  - Exporting the JSON backup (`page.waitForEvent('download')`), clearing IndexedDB, and re-importing the downloaded file restores the same `solve-row` count and the same `stat-ao5-current`
- [ ] **Step 2: Run the tests to confirm they fail.** Run: `npm run test:e2e -- io`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(ui): import/export with summary and backup reminder`.

---

### Task 18: PWA, offline mode and app icon

**Files:**
- Create: `public/icon.svg` (an original atom-style mark: three orbit ellipses around a nucleus, in the indigo primary colour), `src/ui/components/UpdatePrompt.tsx`, `pwa-assets.config.ts`
- Modify: `vite.config.ts`, `src/ui/App.tsx`
- Test: `tests/e2e/offline.spec.ts`

**Interfaces:**
- Consumes: `useApp().timerBusy` (Task 11)
- Produces:
  - vite-plugin-pwa with `registerType: 'prompt'`
  - Workbox `globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,wasm}']` and `maximumFileSizeToCacheInBytes: 10 * 1024 * 1024`, so the cubing worker chunks are precached
  - Manifest: name/short name `Atomic Timer`, `display: 'standalone'`, `theme_color` = indigo primary, icons generated by `@vite-pwa/assets-generator` from `icon.svg`
  - `UpdatePrompt` shows "Update available – Reload" **only while the timer is idle or stopped**, and keeps it hidden until then

- [ ] **Step 1: Write the failing e2e test.**
  - Load `/` and wait until `navigator.serviceWorker.ready` resolves and `scramble-text` holds a real scramble
  - Then `context.setOffline(true)`, reload, and choose puzzle `4x4`
  - A 4x4 scramble appears (more than 30 moves), and a keyboard solve records 1 row
- [ ] **Step 2: Run the test to confirm it fails.** Run: `npm run test:e2e -- offline`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the test again.** Expected: PASS. Also run `npm run build` and check that `dist/manifest.webmanifest` and `dist/sw.js` exist.
- [ ] **Step 5: Commit** with message `feat: installable offline PWA with idle-only update prompt`.

---

### Task 19: Capacitor Android and iOS

**Prerequisite (needs the user):** before running anything, ask the user to install JDK 21 with `! sudo pacman -S jdk21-openjdk`. Do not change the system default JDK.

**Files:**
- Create: `capacitor.config.ts`, `android/` (generated), `ios/` (generated, SwiftPM, so no CocoaPods is needed on Linux), `scripts/with-jdk21.sh`
- Modify: `src/platform/device.ts`, `src/platform/files.ts`, `package.json`
- Test: `src/platform/device.test.ts`

**Interfaces:**
- Consumes: `device.ts` (Task 12), `files.ts` (Task 17)
- Produces:
  - `capacitor.config.ts`: `{ appId: 'com.kwiinnn.atomictimer', appName: 'Atomic Timer', webDir: 'dist' }`
  - `scripts/with-jdk21.sh`: exports `JAVA_HOME=/usr/lib/jvm/java-21-openjdk` when that directory exists, then runs `exec "$@"`. This is a deliberate change from the spec's `org.gradle.java.home`, which would hard-code a local path and break CI.
  - New npm scripts:
    - `cap:sync` = `VITE_BASE=/ npm run build && npx cap sync`
    - `android:build` = `bash scripts/with-jdk21.sh sh -c 'cd android && ./gradlew assembleDebug'`
  - `device.ts`:
    - `isNative()` = `Capacitor.isNativePlatform()`
    - On native, `setKeepAwake` uses `@capacitor-community/keep-awake` and `vibrate` uses `@capacitor/haptics`
  - `files.ts`: on native, `saveTextFile` writes to `Directory.Cache` with `@capacitor/filesystem`, then opens `@capacitor/share` with the file URI

- [ ] **Step 1: Write the failing unit test.** Mock `@capacitor/core` so `isNativePlatform` returns true, and mock the keep-awake plugin. Then `setKeepAwake(true)` calls `KeepAwake.keepAwake` once, and `setKeepAwake(false)` calls `allowSleep`.
- [ ] **Step 2: Run the test to confirm it fails.** Run: `npx vitest run src/platform/device.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Install `@capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor-community/keep-awake @capacitor/haptics @capacitor/filesystem @capacitor/share`, all latest 8.x, then run `npx cap add android && npx cap add ios`. In `AndroidManifest.xml`, keep the screen orientation unlocked.
- [ ] **Step 4: Verify.**
  - Run `npx vitest run src/platform/device.test.ts`. Expected: PASS.
  - Run `npm run cap:sync && npm run android:build`. Expected: `BUILD SUCCESSFUL` and `android/app/build/outputs/apk/debug/app-debug.apk` exists.
  - If an emulator or device is available, install the APK and do one tap solve.
- [ ] **Step 5: Commit** with message `feat: Capacitor Android and iOS projects with native keep-awake, haptics, sharing`.

---

### Task 20: CI, GitHub repo and Pages deploy

**Prerequisite (needs the user):** before running `gh repo create kwiinnn/AtomicTimer --public --source . --push`, stop and get explicit confirmation from the user. The repo is public.

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `.github/workflows/ios.yml`
- Modify: `README.md` (add the live URL and badges)

**Interfaces:**
- `ci.yml`: runs on push and PR, on ubuntu-latest with Node 24.
  - `npm ci`, `typecheck`, `lint`, `test`, then `npx playwright install --with-deps chromium && npm run test:e2e`
  - Then `actions/setup-java` with Temurin 21, and `npm run cap:sync && (cd android && ./gradlew assembleDebug)`
- `pages.yml`: runs on push to `main`. Builds with `VITE_BASE=/AtomicTimer/` and deploys with `actions/deploy-pages`.
- `ios.yml`: runs on push to `main` on `macos-latest`.
  - `npm ci && npm run cap:sync`
  - `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO`

- [ ] **Step 1: Write the three workflows, and commit** with message `ci: test, Pages deploy, iOS compile check`.
- [ ] **Step 2: Ask the user to confirm, then create and push the repo.** Enable Pages with source "GitHub Actions": `gh api -X POST repos/kwiinnn/AtomicTimer/pages -f build_type=workflow`.
- [ ] **Step 3: Verify.** Run `gh run watch` on each workflow. Expected: all three are green. Then `curl -sI https://kwiinnn.github.io/AtomicTimer/` should return `200`.
- [ ] **Step 4: Update the README** with the live URL, and commit.

---

### Task 21: v1 acceptance

- [ ] **Step 1:** Run `npm run typecheck && npm run lint && npm test && npm run test:e2e`. Expected: all pass.
- [ ] **Step 2:** On the deployed Pages URL, with the user, import their real Cubic Timer backup. For their main 3x3 session, compare `mo3`/`ao5`/`ao12`/`ao100` current and best, plus session mean, with the values Cubic Timer shows. They must match to the hundredth. Any difference is a bug to fix in Task 3 or 4, unless it comes from a documented difference in trim rules; in that case, note it in the README.
- [ ] **Step 3:** The user does a short real-world check: 10 keyboard solves on a desktop browser and 10 tap solves on an Android phone browser (installed as a PWA), one +2, one DNF, a delete with undo, then go offline and reload.
- [ ] **Step 4:** Tag the release: `git tag v1.0.0 && git push --tags`. Ask the user before pushing.
