# Atomic Timer — Design Spec

Status: **Draft for review** · 2026-11-11

Atomic Timer is a speedcubing timer for the web (desktop-first, works on phones) that also ships as Android and iOS apps from the same codebase. It follows the UI and feature set of [Cubic Timer](https://github.com/hato-ya/CubicTimer) (itself a fork of Twisty Timer), rebuilt from scratch for the web.

## 1. Positioning

- **Why it exists:** csTimer is the standard web timer but its UI is dense and dated. Atomic Timer offers Cubic Timer's familiar, clean Material UI on desktop and mobile, easy migration from Cubic Timer / Twisty Timer / csTimer, and (from v1.1) smart-timer support.
- **Not a goal:** matching csTimer feature-for-feature.

## 2. Clean-room rule and licensing

- Atomic Timer is a **clean-room implementation**. Cubic Timer is a reference for *features, UX and file formats only*. No source code, strings, images, icons or other assets are copied or translated from Cubic Timer or Twisty Timer (both GPL v3).
- File formats and hardware protocols are facts and may be implemented for compatibility. Import formats are implemented from exported sample files and observed behaviour.
- **Project license: MIT.** Credit to Cubic Timer and Twisty Timer goes in the README as inspiration.
- Third-party dependencies must be MIT/Apache/BSD/OFL-compatible, or used under a permissive option: **cubing.js is used under MPL-2.0** (from its `MPL-2.0 OR GPL-3.0-or-later` dual license). We do not modify cubing.js files.
- Assets: icons from Material Symbols (Apache-2.0), Quicksand font via Fontsource (OFL-1.1), scramble and case images rendered by cubing.js, an original app icon.

## 3. Platforms and distribution

| Target | How | When |
|---|---|---|
| Web (PWA) | Static build on GitHub Pages, deployed by GitHub Actions on push to `main`. Installable, fully offline after the first visit. | v1 |
| Android | Capacitor project in `android/`. Built and tested on Linux. Released on Google Play. | Project created in v1, released in v1.1 |
| iOS | Capacitor project in `ios/`. CI compiles it on a GitHub macOS runner on every push (unsigned). | Not released until an iPhone or testers are available. No Apple Developer account until then. |

Identity:
- Display name: **Atomic Timer**
- App ID: `com.kwiinnn.atomictimer`
- Repo: `kwiinnn/AtomicTimer` (public)

## 4. Stack

| Concern | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build | Vite 8, npm |
| UI | React 19 + MUI 9 (Material Design, styled to echo Cubic Timer's Material 2 look) |
| Native shell | Capacitor 8 |
| Scrambles and images | cubing.js 0.66 (scrambles generated in a web worker) |
| Storage | IndexedDB via Dexie 4, behind a `Storage` interface. `navigator.storage.persist()` is requested, and the app reminds the user to back up periodically. |
| Tests | Vitest (unit), Playwright (end-to-end) |
| Android toolchain | JDK 21 installed alongside the system JDK and used only by this project's Gradle through `org.gradle.java.home`. Android SDK at `~/Android/Sdk`. |

## 5. Repo layout

```
AtomicTimer/
├── docs/                 # spec, plans
├── src/
│   ├── core/             # pure TS, no DOM/React: model, timer state machine, stats, import/export
│   ├── platform/         # Storage (Dexie); later Bluetooth and serial drivers, each behind an interface
│   └── ui/               # React + MUI screens, components, theme
├── tests/e2e/            # Playwright
├── android/  ios/        # Capacitor native projects
└── .github/workflows/    # test, deploy Pages, iOS compile check
```

`src/core` must not import from `ui` or `platform`. It is the most heavily tested part.

## 6. Data model

```ts
type PuzzleId = '333' | '222' | '444' | '555' | '666' | '777' | '333oh' | '333bf'
              | '444bf' | '555bf' | 'clock' | 'minx' | 'pyram' | 'skewb' | 'sq1';
// FMC and multi-blind are out of scope for v1.

interface Session {
  id: string;            // uuid
  name: string;          // e.g. "OH practice"
  puzzle: PuzzleId;      // each session belongs to exactly one puzzle
  order: number;
  createdAt: number;     // epoch ms
}

type Penalty = 'none' | 'plus2' | 'dnf';

interface Solve {
  id: string;
  sessionId: string;
  timeMs: number;        // raw time without the penalty, integer ms
  penalty: Penalty;
  scramble: string;
  createdAt: number;     // epoch ms
  comment: string;
  source: 'keyboard' | 'touch' | 'manual' | 'import' | 'ble' | 'serial';
  phases?: number[];     // multi-phase split times (v1.3)
}
```

Settings are one versioned object stored in IndexedDB. Default values are listed in §9.

## 7. Timer behavior

The timer is a state machine in `src/core` that runs on input events and `performance.now()`:

```
idle ──press──▶ holding ──(held ≥ holdMs)──▶ ready ──release──▶ running ──any press──▶ stopped ──▶ idle
          └─ release before holdMs ─▶ idle
With inspection: idle ──press+release──▶ inspecting ──press──▶ holding ▶ ready ▶ running …
```

- Inputs: Space on the keyboard; a touch or pointer press anywhere on the timer area on touch devices. While the timer runs, any key or touch stops it.
- The running display updates via `requestAnimationFrame`, writing directly to the DOM and bypassing React re-renders. It shows hundredths by default and thousandths if enabled. Stored times are integer ms.
- WCA inspection (off by default): 15 s countdown, alerts at 8 s and 12 s (visual, plus sound or vibration where supported). Starting after 15 s adds +2 automatically. Starting after 17 s makes the solve a DNF.
- While running, everything except the time is hidden.
- Esc cancels a running solve or inspection without recording it.
- Manual entry mode (setting): the timer area becomes a text field where times are typed in.
- The screen is kept awake while timing (Wake Lock API, or the Capacitor plugin in the apps).

## 8. Stats

All stats are computed in `src/core/stats`:

- **Means (mo3):** no trimming. Any DNF makes the result DNF.
- **Averages (ao5, ao12, ao50, ao100, ao1000):** remove the best and worst *k* solves, where *k* = 1 for ao5 and ao12. For larger N, *k* = `ceil(N × trim%)` with a default trim of 5%, configurable. DNFs count as the worst solves. If there are more DNFs than *k*, the average is DNF. +2 is included in the time.
- Displayed averages are rounded to the nearest hundredth (or thousandth if enabled), the same way WCA results are.
- Reported for each stat: **current**, **best** in the session, and best **today** (optional table).
- Also shown: solve count (and how many are not DNF), session mean, best single, worst single.
- Graph: time history with ao5 and ao12 lines, plus an optional discrete (points-only) mode.
- Stats are recomputed incrementally as solves are added, with a cache invalidated when a solve is edited or deleted, so sessions with more than 10k solves stay fast.

## 9. UI

**Mobile (narrower than 1024 px)** follows Cubic Timer's structure:
- **Side drawer:** Timer, (v1.2: OLL/PLL trainers), Theme, Import/Export, Settings, About
- **Toolbar:** a puzzle picker and session picker
- **Three swipeable tabs: Timer / Times / Stats**
- **Timer tab:**
  - Scramble box at the top; tap it to show the next scramble or regenerate
  - Scramble image in the corner; tap it to enlarge
  - Large time display in the Quicksand font
  - After a solve, quick buttons for DNF, +2, comment and delete
- **Times tab:** a grid or list of solves. Tap a solve for details in a bottom sheet (time, scramble, penalty, comment, delete).
- **Stats tab:** the graph above the stats table

**Desktop (1024 px and wider):** the same visual style, with the tabs laid out as panes:
- A persistent sidebar holds the session picker, the times list and the stats table
- The center pane holds the scramble on top, the large timer, and the scramble image
- The graph is collapsible, below the stats or in its own pane

**Keyboard shortcuts** (disabled while timing, except stopping the timer):

| Key | Action |
|---|---|
| Space | Hold to get ready, release to start; any key stops |
| Esc | Cancel solve or inspection |
| 2 / D / C | Toggle +2 / toggle DNF / add a comment on the last solve |
| Delete | Delete the last solve (undo via snackbar) |
| N or → | Next scramble |
| P / S | Puzzle picker / session picker |
| ? | Shortcut overlay |

**Deleting:** deleting a solve shows a snackbar with Undo. Deleting a session asks for confirmation.

**Theming:** light/dark mode follows the system by default, and there's a color-theme picker (palette cards). Custom text styles and background images come in v1.3.

**Settings in v1** (defaults in brackets):
- Hold delay [300 ms]
- Inspection [off], inspection alerts [on]
- Show thousandths [off]
- Manual entry [off]
- Trim % for ao50 and longer [5%]
- DNF counting rules
- Show session stats table [on], show today's stats table [off]
- Discrete graph [off]
- Timer text size, scramble text size
- Theme [system]
- Backup reminder [on]

**Translations:** English only in v1. All UI strings go through an i18n layer so that more languages can be added later.

## 10. Import and export

- **Native backup:** versioned JSON (`{ format: "atomic-timer", version: 1, sessions, solves, settings }`). Used for both import and export.
- **Import Cubic Timer / Twisty Timer:**
  - Backup CSV. Each puzzle and category pair becomes one session.
  - The format is implemented from sample exported files (e.g. `Solves_333_Sample.txt`), not from source code.
- **Import csTimer:** csTimer's JSON export. Each csTimer session becomes one session, and the puzzle is inferred from its session settings or scramble type.
- **Export Cubic Timer CSV**, so users can move back.
- **Duplicates:** an incoming solve that matches an existing solve in the same session on (`createdAt`, `timeMs`, `scramble`) is skipped. Re-importing the same file never creates duplicates.
- An import summary shows the number of sessions created, solves added and duplicates skipped.

## 11. Offline / PWA

- The service worker precaches the app shell, fonts and the cubing.js workers and puzzle data. Everything works offline after the first visit.
- When an update is available, the prompt is shown only while the timer is idle.

## 12. Roadmap

| Version | Scope |
|---|---|
| **v1** | Everything in §§6–11: timer, all listed WCA puzzles, sessions, times list, stats and graph, imports and exports, themes, settings, PWA on GitHub Pages. Capacitor Android and iOS projects created, with the iOS compile check in CI. |
| **v1.1** | GAN and QiYi Bluetooth smart timers: Web Bluetooth in Chromium, native BLE in the apps via `@capacitor-community/bluetooth-le`. **First Google Play release.** |
| **v1.2** | OLL/PLL trainers with progress tracking; case images rendered by cubing.js |
| **v1.3** | Cross/XCross hints, multi-phase timing, stack timers (Web Serial on desktop Chromium, USB-serial plugin on Android), background images, text styles |
| Later | Translations (new or community, not copied), optional cloud sync, FMC and multi-blind, iOS release once a device or testers are available |

## 13. Testing and acceptance for v1

- Vitest suites, written test-first, for:
  - The timer state machine: hold, early release, inspection +2 and DNF thresholds, cancel
  - Every stat: trimming, DNF rules, rounding, rolling bests
  - Each importer, using real sample files, including the duplicate check
  - JSON export followed by re-import, which must give identical data
- Playwright tests:
  - Keyboard solve flow: hold, start, stop, a solve appears and the stats update
  - Penalty shortcuts
  - Delete and undo
  - The mobile layout at phone width
  - The app works offline after the first load
- CI on every push: typecheck, lint, unit tests, e2e tests, the Pages build, an Android debug build, and the iOS compile check.

**v1 is done when:** you can use it daily instead of Cubic Timer, on a desktop browser and on an Android phone browser, with your existing Cubic Timer history imported and its stats matching what Cubic Timer showed.
