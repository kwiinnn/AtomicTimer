# Theme Styles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `uiStyle` setting (Material, Liquid Glass, Flat, Outline, Brutalist) that restyles every surface, picked from live preview cards on the Theme page, with an iOS-like Liquid Glass (lensing where Chromium allows).

**Architecture:** A per-style token table (`src/ui/theme/styles.ts`) feeds `makeTheme`, whose MUI component overrides apply it to every surface; floating vs content is decided by component type. Glass extras are small independent pieces: palette blobs in the background stack, a `LensLayer` that attaches SVG displacement filters to floating surfaces (Chromium only) via a CSS variable, and a pointer-driven highlight variable. Global CSS handles "solve running" and reduced-transparency fallbacks.

**Tech Stack:** React 19, MUI 9 (Emotion), TypeScript, Vitest, Playwright 1.65 (both projects are Chromium), Capacitor.

**Spec:** `docs/superpowers/specs/2026-11-12-theme-styles-design.md`

## Global Constraints

- Default `uiStyle` is `'material'`; Material must render exactly as today (same overrides, same hand-styled pane values: `alpha(paper, 0.6)` + `blur(14px)` in DesktopPanes/GraphPanel, `alpha(paper, 0.75)` + `blur(14px)` in ThemePage sections).
- Styles change surfaces only: fill, transparency, blur, borders, shadows, radius, control shape. Never fonts, palette colours, timer digits, layout or order (the Glass tab-strip inset margin is the one sanctioned exception).
- Radii: Material 8 · Glass 24 (controls pill) · Flat 12 · Outline 12 · Brutalist 0.
- Brutalist: 2px solid ink border, `4px 4px 0` ink shadow with no blur; pressed → shadow none + `translate(4px, 4px)`.
- Outline: transparent fills, 1px border ink @ 0.2, outlined buttons.
- Flat: opaque tinted fills, no shadow, no border, no button elevation.
- Glass content: paper @ ~0.55 + `blur(20px) saturate(1.6)`, no lens. Glass floating: paper @ ~0.35 + `blur(12px) saturate(1.8)` + lens (Chromium) + highlight border + soft shadow `0 8px 32px rgba(0,0,0,.18)`.
- Lens strength subtle (edge displacement of a few px; centre undisplaced). Chromium only (Chrome, Edge, Android WebView); Safari, iOS WKWebView and Firefox get frosted only, which must look finished.
- While `body[data-timing="true"]`: no `backdrop-filter` anywhere (fills stay translucent).
- `prefers-reduced-transparency: reduce` → glass surfaces opaque paper, no blur/lens. `prefers-reduced-motion: reduce` or touch → static highlight.
- Body text on every content surface ≥ 4.5:1 for every preset × mode × style.
- No new runtime dependencies.

## Review Focus

- Menus, dialogs and snackbars mount after the style is chosen: each newly mounted floating surface must get its lens (and lose it after switching away from Glass). → Task 7 e2e `late-mounted menus get the lens`.
- Resizing a floating surface (rotating a phone, opening the drawer, a snackbar growing): the lens map must follow the new size, not stretch an old one. → Task 7 unit `lensFor returns a new id per size bucket` + e2e `lens follows a resized surface`.
- Custom palette with extreme colours (near-white `from`, near-black `to`) in Glass/Outline: text must still read. → Task 2 contrast test includes the custom extremes.
- Background photo + Glass: blobs must not appear, and the dim must still sit under the glass. → Task 5 e2e `glass with a photo shows no blobs`.
- Starting a solve with Glass on a long times list (desktop panes visible): no backdrop-filter while timing. → Task 5 e2e `timing removes backdrop filters`.

---

### Task 0: Lens spike (throwaway, gate)

Prove a convincing subtle lens in the real app before building anything else. Nothing from this task is committed except the outcome note.

- [ ] **Step 1:** In a scratch branch, add a hard-coded SVG filter to `App.tsx`: `feImage` (canvas-generated displacement map for the toolbar's size and radius: R/G encode x/y offset, neutral 128 in the centre, ramping near the edges over ~16px) → `feDisplacementMap scale≈10 xChannelSelector="R" yChannelSelector="G"`. Apply `backdrop-filter: url(#lens) blur(12px) saturate(1.8)` to the AppBar and to a dialog paper (open the comment dialog).
- [ ] **Step 2:** Screenshot desktop (Chromium, scrollbars visible) over the indigo gradient with glass blobs faked in and over `tests/e2e/fixtures/background.png`; show the user.
- [ ] **Step 3:** Record the outcome under "Spike outcome" at the end of this plan: the filter-region units that worked (`userSpaceOnUse` vs `objectBoundingBox`), map edge width and scale chosen, and whether `backdrop-filter: var(--lens,) blur()` with an empty var fallback is accepted by Chromium. If the user rejects the look, stop and return to the user before Task 7.
- [ ] **Step 4:** `git checkout feat/theme-styles`, delete the scratch branch, commit the note: `docs: theme styles lens spike outcome`.

---

### Task 1: `uiStyle` setting

**Files:**
- Modify: `src/core/settings.ts` (types, `DEFAULT_SETTINGS`, `ENUMS`)
- Modify: `src/ui/i18n/en.ts`
- Test: `src/core/settings.test.ts`

**Interfaces:**
- Produces: `export type UiStyle = 'material' | 'glass' | 'flat' | 'outline' | 'brutalist'`; `export const UI_STYLE_IDS: UiStyle[]` in that order; `Settings.uiStyle: UiStyle` (default `'material'`); i18n keys `theme.style` = `'Style'`, `style.material` = `'Material'`, `style.glass` = `'Liquid Glass'`, `style.flat` = `'Flat'`, `style.outline` = `'Outline'`, `style.brutalist` = `'Brutalist'`.

- [ ] **Step 1: Write the failing tests** in `settings.test.ts`:

```ts
test('uiStyle defaults to material and existing settings migrate to it', () => {
  expect(DEFAULT_SETTINGS.uiStyle).toBe('material');
  expect(migrateSettings({ palette: 'teal' }).uiStyle).toBe('material');
});
test('uiStyle accepts every style and rejects others', () => {
  for (const id of UI_STYLE_IDS) expect(migrateSettings({ uiStyle: id }).uiStyle).toBe(id);
  expect(migrateSettings({ uiStyle: 'neumorphic' }).uiStyle).toBe('material');
  expect(UI_STYLE_IDS).toEqual(['material', 'glass', 'flat', 'outline', 'brutalist']);
});
```

- [ ] **Step 2:** `npx vitest run src/core/settings.test.ts` → FAIL (`UI_STYLE_IDS` not exported).
- [ ] **Step 3:** Add the type, constant, field (doc comment: "How surfaces are drawn; independent of palette and fonts."), default and `ENUMS.uiStyle = UI_STYLE_IDS`; add the i18n keys.
- [ ] **Step 4:** `npx vitest run src/core/settings.test.ts` → PASS; `npx tsc --noEmit -p .` clean.
- [ ] **Step 5:** Commit `feat(settings): uiStyle setting (material default)`.

---

### Task 2: Style tokens and readable surfaces

**Files:**
- Create: `src/ui/theme/styles.ts`
- Modify: `src/ui/theme/palettes.ts` (add `compositeOver`, `mix`)
- Test: `src/ui/theme/styles.test.ts`

**Interfaces:**
- Consumes: `UiStyle`, `UI_STYLE_IDS` (Task 1); `ResolvedTheme` (`resolve.ts`); `contrastRatio`.
- Produces:

```ts
export type SurfaceKind = 'content' | 'float';
export interface Layer { fillAlpha: number; blurPx: number; saturate: number; lens: boolean }
export interface StyleTokens {
  radius: number;                       // cards, dialogs (px)
  control: 'default' | 'pill' | 'flat' | 'outlined' | 'block';
  content: Layer;
  float: Layer;
  border: 'none' | 'hairline' | 'highlight' | 'heavy';
  shadow: 'material' | 'none' | 'soft' | 'hard';
}
export const STYLE_TOKENS: Record<UiStyle, StyleTokens>;
export const PAPER = { light: '#ffffff', dark: '#1e1e1e' } as const;   // moved from makeTheme
/** Opaque base colour of a surface before alpha: paper, or for Flat a tint of paper toward stops[0] (mix 0.12; float 0.06). */
export function surfaceBase(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme): string;
/** The colour text actually sits on: surfaceBase at the layer's fillAlpha composited over `behind`. */
export function effectiveSurface(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme, behind: string): string;
// palettes.ts
export function compositeOver(fg: string, alpha: number, bg: string): string;  // '#rrggbb'
export function mix(a: string, b: string, t: number): string;                  // '#rrggbb', t=0 → a
```

Token values: Material `{ radius 8, control 'default', content/float fillAlpha 1, blur 0, saturate 1, lens false, border 'none', shadow 'material' }`; Glass `{ 24, 'pill', content {0.55, 20, 1.6, false}, float {0.35, 12, 1.8, true}, 'highlight', 'soft' }`; Flat `{ 12, 'flat', both alpha 1 no blur, 'none', 'none' }`; Outline `{ 12, 'outlined', both alpha 0, 'hairline', 'none' }`; Brutalist `{ 0, 'block', both alpha 1, 'heavy', 'hard' }`.

- [ ] **Step 1: Write the failing tests:**
  - `compositeOver('#000000', 0.5, '#ffffff')` → `'#808080'` (±1 per channel); `mix('#000000', '#ffffff', 0.25)` → `'#404040'`.
  - `STYLE_TOKENS.material` equals the Material values above exactly; radii per style `[8, 24, 12, 12, 0]` in `UI_STYLE_IDS` order.
  - Contrast sweep: for every `PALETTE_IDS` palette plus two custom themes (`{from:'#fafafa',to:'#f0f0f0'}` and `{from:'#000000',to:'#101010'}`, accent `#ff4081`, angle 0) × modes light/dark × every style × kinds content/float × each of `r.stops`: `contrastRatio(r.ink, effectiveSurface(style, kind, r, stop)) >= 4.5`, message `${palette}/${mode}/${style}/${kind} on ${stop}`.
- [ ] **Step 2:** `npx vitest run src/ui/theme/styles.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement `styles.ts` and the two helpers. If a Glass alpha fails the sweep, raise that layer's `fillAlpha` until it passes (record the final value in the commit message).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(theme): style tokens with a contrast sweep over every palette`.

---

### Task 3: `makeTheme` applies the style

**Files:**
- Modify: `src/ui/theme/makeTheme.ts`
- Create: `src/ui/theme/mui-augment.d.ts`
- Create: `src/ui/theme/surface.ts`
- Modify: `src/ui/App.tsx` (pass `settings.uiStyle`)
- Test: `src/ui/theme/makeTheme.test.ts`

**Interfaces:**
- Consumes: `STYLE_TOKENS`, `surfaceBase`, `PAPER` (Task 2).
- Produces:
  - `makeTheme(r: ResolvedTheme, fontFamily: string, uiStyle: UiStyle = 'material'): Theme`.
  - Augmentation: `Theme.uiStyle: UiStyle`, `Theme.resolved: ResolvedTheme` (and optional on `ThemeOptions`).
  - Add to `styles.ts`: `export const FLOAT_SELECTOR = '.MuiAppBar-root, .MuiDialog-paper, .MuiPopover-paper, .MuiDrawer-paper, .MuiSnackbarContent-root, .glass-tabs, [data-surface="float"]'` in `styles.ts` (used by Tasks 5 and 7).
  - `surface.ts`: `export function surfaceSx(kind: SurfaceKind, opts?: { materialAlpha?: number }): (theme: Theme) => CSSObject` — for hand-styled panes. Material returns `{ backgroundColor: alpha(paper, opts.materialAlpha ?? 0.6), backdropFilter: 'blur(14px)' }` (today's values); other styles return that kind's token CSS (same CSS the `MuiPaper` override produces).
  - A shared `layerCss(tokens, kind, r): CSSObject` inside `makeTheme.ts` producing fill (`alpha(surfaceBase, fillAlpha)`), `backdropFilter` (Glass float: `var(--lens,) blur(12px) saturate(1.8)`; Glass content: `blur(20px) saturate(1.6)`; others none), border, shadow, radius. Glass `highlight` border = `1px solid alpha(ink, 0.18)` plus an inset `inset 1px 1px 0 alpha('#fff', 0.35)` specular and a `::before` radial gradient at `var(--glass-x, 20%) var(--glass-y, 0%)` with `background-attachment: fixed` (Task 8 drives the vars).
- Overrides per non-Material style: `MuiPaper` root (content), `MuiAppBar`, `MuiDialog.paper`, `MuiPopover.paper`, `MuiDrawer.paper`, `MuiSnackbarContent` (float), `MuiButton` / `MuiToggleButton` / `MuiChip` (control shape: pill → `borderRadius: 999`; flat → `disableElevation`, no ripple glow; outlined → `defaultProps.variant: 'outlined'` for `MuiButton`; block → 0 radius, heavy border, hard shadow, `:active` pressed rule), `MuiSlider`/`MuiSwitch` thumbs (Glass: translucent white thumb with soft shadow), `shape.borderRadius = tokens.radius`. Glass-only `MuiCssBaseline` additions: `body[data-timing="true"] *, body[data-timing="true"] *::before { backdrop-filter: none !important }` and `@media (prefers-reduced-transparency: reduce)` rule that gives `FLOAT_SELECTOR` and `.MuiPaper-root` opaque `PAPER[mode]` and `backdrop-filter: none`.
- Material: components stay exactly `MuiCssBaseline` (scrollbars) + `MuiAppBar` (today's); radius 8.

- [ ] **Step 1: Write the failing tests** in `makeTheme.test.ts` (use `resolveTheme` with indigo/light):
  - `material keeps today's theme`: `Object.keys(makeTheme(r, 'X').components!)` equals `['MuiCssBaseline', 'MuiAppBar']`, `shape.borderRadius === 8`, `uiStyle === 'material'`, and `makeTheme(r,'X')` deep-equals `makeTheme(r,'X','material')` on `components` and `palette`.
  - `radius follows the style`: `[8, 24, 12, 12, 0]` for `UI_STYLE_IDS`.
  - `glass floating layers reference the lens variable`: serialised `components.MuiAppBar.styleOverrides` for glass contains `var(--lens,)`; glass `MuiPaper` does not.
  - `glass adds timing and reduced-transparency rules`: serialised glass `MuiCssBaseline.styleOverrides` contains `body[data-timing="true"]` and `prefers-reduced-transparency`; Material's doesn't.
  - `surfaceSx keeps material panes identical`: `surfaceSx('content', { materialAlpha: 0.75 })(makeTheme(r,'X'))` equals `{ backgroundColor: alpha('#ffffff', 0.75), backdropFilter: 'blur(14px)' }`.
- [ ] **Step 2:** `npx vitest run src/ui/theme/makeTheme.test.ts` → FAIL.
- [ ] **Step 3:** Implement; in `App.tsx` pass `settings.uiStyle` into `makeTheme` (add to the `useMemo` deps).
- [ ] **Step 4:** Replace the hand-styled panes: `DesktopPanes.tsx:13` and `GraphPanel.tsx:15` → `sx={[…, surfaceSx('content')]}` (drop their `bgcolor`/`backdropFilter`); `ThemePage.tsx:29` Section → `surfaceSx('content', { materialAlpha: 0.75 })`.
- [ ] **Step 5:** `npx vitest run` → PASS; `npx tsc --noEmit -p .`; `npx playwright test tests/e2e/theme.spec.ts tests/e2e/layout.spec.ts` → PASS (Material unchanged).
- [ ] **Step 6:** Commit `feat(theme): makeTheme applies the chosen surface style`.

---

### Task 4: Style picker on the Theme page

**Files:**
- Create: `src/ui/settings/StylePicker.tsx`
- Modify: `src/ui/settings/ThemePage.tsx` (new Section between Mode and Themes)
- Test: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: `UI_STYLE_IDS`, `makeTheme(r, family, style)`, `backgroundCss` (`AppBackground.tsx`), i18n keys (Task 1).
- Produces: `StylePicker({ value, onChange, resolved, fontFamily }: { value: UiStyle; onChange: (s: UiStyle) => void; resolved: ResolvedTheme; fontFamily: string })`. Each option is a `ButtonBase` with `aria-label` = style label and `aria-pressed`, same grid as palette cards (`repeat(auto-fill, minmax(118px, 1fr))`). Its preview box is painted with `resolved.gradient` (plus glass blobs for Glass, Task 5 adds `glassBlobs`) and contains, inside a nested `ThemeProvider theme={makeTheme(resolved, fontFamily, id)}`, a small `Paper` (content), a `Button variant="contained"` "Aa" and a `Chip` — real components, so previews match exactly. Preview contents are `aria-hidden` and `tabIndex={-1}`.

- [ ] **Step 1: Write the failing e2e tests** (`theme.spec.ts`, reuse `openTheme`):
  - `style choice restyles surfaces and persists`: click `button 'Liquid Glass'` → `aria-pressed='true'`; navigate to Settings; first `.MuiPaper-root` in `main` has `border-radius: 24px` and `backdrop-filter` matching `/blur\(20px\)/`; `waitForSavedSettings(page, { uiStyle: 'glass' })`; reload; still 24px.
  - `each style has its look`: for `[['Flat','12px'], ['Outline','12px'], ['Brutalist','0px']]` pick it and assert the Settings Paper's `border-radius`; additionally Flat `box-shadow: none`, Outline `background-color: rgba(0, 0, 0, 0)`, Brutalist `box-shadow` matching `/4px 4px 0px/`.
  - `material stays the default`: fresh load → `button 'Material'` has `aria-pressed='true'`.
- [ ] **Step 2:** `npx playwright test tests/e2e/theme.spec.ts -g "style"` → FAIL (no Style buttons).
- [ ] **Step 3:** Implement `StylePicker` and wire it into `ThemePage` with `updateSettings({ uiStyle })`.
- [ ] **Step 4:** Run → PASS on desktop and mobile.
- [ ] **Step 5:** Commit `feat(ui): Style picker with live previews on the Theme page`.

---

### Task 5: Glass background blobs, solve and accessibility fallbacks

**Files:**
- Modify: `src/ui/theme/AppBackground.tsx` (`backgroundCss`, `themeVars` take blobs)
- Modify: `src/ui/App.tsx`, `src/ui/settings/StylePicker.tsx` (Glass preview)
- Test: `src/ui/theme/AppBackground.test.ts` (create if absent), `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `export function glassBlobs(r: ResolvedTheme): string` — 4 comma-joined `radial-gradient(circle at X% Y%, rgba(c, a) 0, transparent R%)` layers using `r.primary`, `r.secondary`, `r.stops[1]`, `r.primary` at positions `(15% 20%)`, `(85% 15%)`, `(70% 85%)`, `(20% 80%)`, radius 45%, alpha 0.55 dark / 0.35 light. `backgroundCss(r, image, blobs?: string | null)`: blobs are layered over the gradient **only when `image` is null**.

- [ ] **Step 1: Write the failing tests:**
  - Unit: `backgroundCss(r, null, glassBlobs(r))` starts with `radial-gradient(` and ends with `r.gradient`; `backgroundCss(r, { url: 'u', dim: 0.4 }, glassBlobs(r))` contains no `radial-gradient`; `backgroundCss(r, null)` equals `r.gradient`.
  - E2E `glass adds palette blobs, other styles don't`: pick Liquid Glass → `app-background` `background-image` contains `radial-gradient`; pick Material → not.
  - E2E `glass with a photo shows no blobs`: upload `fixtures/background.png`, pick Liquid Glass → contains `url("blob:` and not `radial-gradient`.
  - E2E `timing removes backdrop filters` (desktop project): pick Liquid Glass, go to Timer, `keyboard.down('Space')` until `data-state='ready'`, `keyboard.up('Space')`; while running, `header` and `aside` computed `backdrop-filter` is `none`; stop with Space; after stop `header` `backdrop-filter` matches `/blur/`.
  - E2E `reduced transparency gives solid glass`: CDP `Emulation.setEmulatedMedia({ features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })` via `page.context().newCDPSession(page)`; pick Liquid Glass; Settings Paper `backdrop-filter` is `none` and `background-color` is `rgb(255, 255, 255)`.
- [ ] **Step 2:** Run unit + `npx playwright test tests/e2e/theme.spec.ts -g "blob|timing|transparency"` → FAIL (blobs, maybe others).
- [ ] **Step 3:** Implement `glassBlobs`, thread `settings.uiStyle === 'glass' ? glassBlobs(resolved) : null` through `themeVars` in `App.tsx`; use it in the Glass preview card. Fix any timing / reduced-transparency rule from Task 3 that the e2e exposes.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(theme): glass palette blobs; no blur while timing; reduced-transparency fallback`.

---

### Task 6: Floating glass tab strip (phones)

**Files:**
- Modify: `src/ui/layout/MobileTabs.tsx` (add `className="hide-while-timing glass-tabs"` always; styling comes from the theme)
- Modify: `src/ui/theme/makeTheme.ts` (Glass-only `MuiTabs` / `MuiTab` overrides)
- Test: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Glass `MuiTabs.root`: `margin: '8px 12px'`, `borderRadius: 999`, float layer CSS (fill, `var(--lens,)` backdrop, highlight, soft shadow), `minHeight: 44`. `MuiTabs.indicator`: `height: 'calc(100% - 8px)'`, `top: 4`, `borderRadius: 999`, `backgroundColor: alpha(ink, 0.14)`, `zIndex: 0`. `MuiTab.root`: `zIndex: 1`, `minHeight: 44`. Other styles: no `MuiTabs` override (Material identical).

- [ ] **Step 1: Write the failing e2e test** `glass turns the phone tabs into a floating pill` (mobile project only; `test.skip(!isMobile)`): pick Liquid Glass, return to Timer; `getByRole('tablist')`'s parent `.MuiTabs-root` has `border-radius` `/999px|9.99e\+?\d+px/` and `margin-left: 12px`; the tab order is still Timer, Times, Stats; tapping `Times` still shows `times-list` in viewport.
- [ ] **Step 2:** `npx playwright test tests/e2e/layout.spec.ts --project=mobile -g pill` → FAIL.
- [ ] **Step 3:** Implement the overrides and class.
- [ ] **Step 4:** Run → PASS; `npx playwright test tests/e2e/layout.spec.ts` (both projects) PASS.
- [ ] **Step 5:** Commit `feat(ui): floating glass tab pill on phones`.

---

### Task 7: Lensing on floating surfaces (Chromium)

**Files:**
- Create: `src/ui/theme/glass/lens.ts`, `src/ui/theme/glass/LensLayer.tsx`
- Modify: `src/ui/App.tsx` (render `<LensLayer enabled={settings.uiStyle === 'glass'} />`)
- Test: `src/ui/theme/glass/lens.test.ts`, `tests/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: `FLOAT_SELECTOR` (Task 3); the `var(--lens,)` hook in float backdrop-filter (Task 3); spike outcome (Task 0) for map technique, units and scale.
- Produces:

```ts
// lens.ts
export function supportsLens(ua?: string, brands?: { brand: string }[]): boolean; // Chromium engine, not iOS
export function bucket(px: number): number;                 // round up to a multiple of 16
export function lensFor(w: number, h: number, radius: number): { id: string; mapUrl: string; w: number; h: number };
// id = `lens-${bucket(w)}x${bucket(h)}r${round(radius)}`; mapUrl is a cached canvas data URL
```

`LensLayer` (renders `null` when `!enabled || !supportsLens() || reduced-transparency`): renders a hidden `<svg width=0 height=0><defs>` with one `<filter>` per distinct id in use; watches `FLOAT_SELECTOR` elements with a `MutationObserver` on `document.body` (childList, subtree) and a `ResizeObserver` on each; on size change sets `el.style.setProperty('--lens', \`url(#${id})\`)`; removes the property (and unused filters) when disabled/unmounted.

- [ ] **Step 1: Write the failing unit tests:**
  - `supportsLens`: true for a Chrome desktop UA, Edge UA, Android WebView UA (`… Chrome/130.0 Mobile Safari/537.36; wv`), and for `brands: [{brand:'Chromium'}]`; false for Safari macOS, iOS Safari, iOS Chrome (`CriOS`), Firefox.
  - `lensFor returns a new id per size bucket`: `lensFor(100, 40, 24).id === lensFor(110, 44, 24).id`; `!== lensFor(200, 40, 24).id`; `bucket(1) === 16`, `bucket(16) === 16`, `bucket(17) === 32`.
- [ ] **Step 2:** `npx vitest run src/ui/theme/glass` → FAIL.
- [ ] **Step 3:** Implement `lens.ts` (map generation per spike outcome; skip `mapUrl` generation when `document` is undefined) and `LensLayer`.
- [ ] **Step 4: Write the e2e tests:**
  - `glass lenses the toolbar in Chromium`: pick Liquid Glass → `header` `backdrop-filter` matches `/url\("?#lens-/`; Settings content Paper does not.
  - `late-mounted menus get the lens`: pick Liquid Glass, open the puzzle picker (`getByTestId('puzzle-picker')`) → `.MuiPopover-paper` `backdrop-filter` matches `/url/`; close it; pick Material on the Theme page; reopen → `.MuiPopover-paper` `backdrop-filter` is `none`.
  - `lens follows a resized surface`: pick Liquid Glass, record header `--lens`, `page.setViewportSize({ width: 700, height: 900 })` → header `--lens` differs.
  - `Safari gets frosted glass without lens`: `test.use({ userAgent: '<Safari 18 macOS UA>' })` in a `describe`; pick Liquid Glass → `header` `backdrop-filter` matches `/blur\(12px\)/` and not `/url/`.
- [ ] **Step 5:** `npx vitest run` and `npx playwright test tests/e2e/theme.spec.ts -g "lens|menu|Safari"` → PASS.
- [ ] **Step 6:** Commit `feat(theme): liquid glass lensing on floating surfaces (Chromium)`.

---

### Task 8: Pointer-following highlights

**Files:**
- Create: `src/ui/theme/glass/useGlassHighlight.ts`
- Modify: `src/ui/App.tsx` (call `useGlassHighlight(settings.uiStyle === 'glass')`)
- Test: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `useGlassHighlight(enabled: boolean): void` — active only when `enabled` and `matchMedia('(hover: hover) and (pointer: fine)')` and not `(prefers-reduced-motion: reduce)`; a passive `pointermove` listener on `window`, rAF-throttled, sets `--glass-x` / `--glass-y` (px) on `document.documentElement`; removes listener and both properties when inactive. Consumed by Task 3's `::before` gradient.

- [ ] **Step 1: Write the failing e2e tests:**
  - `highlights follow the mouse on desktop` (skip mobile): pick Liquid Glass; `mouse.move(300, 200)` → `documentElement` `--glass-x` is `300px` (poll).
  - `reduced motion keeps highlights still`: `emulateMedia({ reducedMotion: 'reduce' })`, pick Liquid Glass, move mouse → `--glass-x` is empty.
  - `touch devices keep highlights still` (mobile project only): pick Liquid Glass, `page.touchscreen.tap(100, 300)` → `--glass-x` empty.
- [ ] **Step 2:** Run `-g highlights` → FAIL.
- [ ] **Step 3:** Implement the hook and wire it.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(theme): glass highlights follow the pointer on desktop`.

---

### Task 9: Visual review and full verification

- [ ] **Step 1:** Screenshot every style in light and dark, with and without the fixture photo, at 1440×900 and Pixel 7, on: timer view, Settings, Theme page, an open dialog, the drawer (headless Chromium launched with `ignoreDefaultArgs: ['--hide-scrollbars']`; script in the scratchpad, not the repo). Also one Glass set with a Safari UA (frosted fallback).
- [ ] **Step 2:** Review by eye against the spec table; tune token numbers in `styles.ts` (keeping Task 2's sweep green); show the user the Glass and Brutalist sets.
- [ ] **Step 3:** `npx tsc --noEmit -p . && npx eslint . && npx vitest run && npx playwright test` → all PASS.
- [ ] **Step 4:** Ask the user to try the Android build on their phone with Glass on and scroll a long times list (use `window.__seed` via `?e2e=1` to add ~500 solves); note any stutter and, if present, lower Glass content `blurPx`.
- [ ] **Step 5:** Commit any tuning `style(theme): tune style tokens after visual review`.

---

## Spike outcome

- Works in Chromium: `backdrop-filter: var(--lens,) blur(Npx) saturate(1.8)` with `--lens: url(#id)` computes to `url("#id") blur(…)`; with `--lens` unset the empty fallback leaves a valid `blur(…) saturate(…)`.
- Filter: `filterUnits="userSpaceOnUse" x=0 y=0 width=w height=h color-interpolation-filters="sRGB"`; coordinates are the element's own box. `feImage href=<canvas data URL> width=w height=h preserveAspectRatio="none"` → `feDisplacementMap in="SourceGraphic" scale=16 xChannelSelector="R" yChannelSelector="G"`.
- Map: per pixel, signed distance d to the rounded-rect edge; within an 18px edge band, magnitude m = (1 − d/18)², R/G = 128 ± normal·m·127 (pointing inward so the edge samples from inside), B 128, A 255; neutral 128 elsewhere.
- Strength 16 with no blur reads clearly as glass (grid lines bend at edges); blur 3px softens it; **blur 12px erases the lens entirely**.
- Ruling: Glass float blur is 3px (not 12px) so the lens stays visible; fill alpha raised as needed by the Task 2 contrast sweep to compensate.
- Screenshot: /tmp/claude-1000/-home-selrahc-Selrahc-Projekte-AtomicTimer/aa15de09-4e5e-447e-b0f6-e54d44e7ffda/scratchpad/lens-spike-strength16-noblur.png
