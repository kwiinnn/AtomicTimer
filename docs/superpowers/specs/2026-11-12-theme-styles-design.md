# Theme styles — design

Date: 2026-11-12 · Branch: `feat/theme-styles` (on top of `feat/scrollbars`)

## Intent

Give the app a **Style** choice that changes how its surfaces are drawn — panels, bars,
dialogs, menus, buttons — independently of colour (palette), mode and fonts. The headline
style is **Liquid Glass**, built to look as close to iOS's Liquid Glass as the web allows;
alongside it come Flat, Outline and Brutalist, and today's look kept as Material.

## Goals

- Five styles: `material` (default), `glass`, `flat`, `outline`, `brutalist`.
- Any style × any palette (15 presets + custom) × light/dark/system × background image on/off.
- Picked on the Theme page from live preview cards; applies instantly like every other setting.
- Every screen follows the style with no per-screen opt-in, including screens added later.

## Non-goals

- No layout changes: nav, panes, order and spacing stay as they are (one agreed exception:
  the floating tab pill in Glass, below).
- Styles never change fonts, palette colours or the timer digits.
- Not in this round: Neumorphic, Retro terminal, tilt-reactive highlights, pronounced lensing.

## Anti-goals (failure even if it "works")

- Any existing user's app looking different before they pick a style.
- Times, scrambles or stats text becoming harder to read in any style/palette/mode combination.
- Dropped frames or timer jitter during a solve because of glass effects.
- A broken or half-rendered look on Safari/iOS/Firefox where lensing isn't supported — those
  must get a complete, deliberate frosted version.

## Decisions (made with the user)

| # | Decision |
|---|----------|
| Q1 | A style changes surfaces only: fill, transparency, blur, borders, shadows, corner radius, button shape. |
| Q2 | Ship Material, Liquid Glass, Flat, Outline, Brutalist. |
| Q3 | Style is its own setting, combinable with everything. |
| Q4 | Material is the default; existing settings migrate to it. |
| Q5 | Glass aims for iOS: frosted + **lensing** (refraction at edges) where the browser can do it (Chromium: Chrome, Edge, Android WebView); frosted-only on Safari, iOS (WKWebView) and Firefox. |
| Q6 | While a solve runs, glass drops blur and lensing (plain tinted translucency). Respect `prefers-reduced-transparency`: solid panels. |
| Q7 | New **Style** section on the Theme page, under Mode, above Palettes, with live preview cards drawn in each style using the current palette. |
| Q8 | Apple's layering: the **floating layer** (toolbar, mobile tab strip, nav drawer, dialogs, menus/popovers, snackbars, controls) gets lensing glass; **content** panels (times list, stats, settings/theme cards) get a lighter frosted tint, no lensing. |
| Q9 | Specular highlights follow the mouse on desktop; static on touch devices. |
| Q10 | Glass uses pill-shaped buttons, chips and tab strip; 24px radius on cards and dialogs. |
| Q11 | In Glass with no background image, still (not animated) soft colour blobs from the palette sit behind the UI; plain gradient again in other styles. |
| Q12 | Flat / Outline / Brutalist exactly as specified below. |
| Q13 | The Theme page's hard-coded frosted panels go; they follow the style. |
| Q14 | Glass: the mobile tab strip stays at the **top** (under the toolbar) and becomes a floating, inset glass pill with lensing; the selected tab is a brighter glass capsule inside it. The toolbar stays docked full-width but glass. Nothing moves when switching styles. |
| Q15 | Lensing strength: subtle (a few px of edge bend). |
| Q16 | `prefers-reduced-motion`: highlights static. |

## Approaches considered

- **A. Style in the shared theme (chosen).** A per-style token table feeds `makeTheme`; MUI
  component overrides apply it to every surface. Floating vs content decided by component type;
  the few hand-styled spots are cleaned up. Every screen follows automatically. Trade-off: a plain
  `Paper` that should float needs an explicit marker (only a couple exist).
- **B. A `Surface` wrapper component** used everywhere. Explicit, but touches all 18 surface files
  and still misses MUI-internal surfaces (menus, dialogs), so it needs A anyway.
- **C. Global CSS keyed on `data-style`.** Fights Emotion specificity; two styling systems.

The user picked A.

## Design

### Setting

- `Settings.uiStyle: 'material' | 'glass' | 'flat' | 'outline' | 'brutalist'`, default `'material'`,
  exported as `UI_STYLE_IDS`, validated like the other enum settings in `src/core/settings.ts`
  (unknown/missing → default; no schema version bump needed since sanitising fills defaults).

### Tokens

`src/ui/theme/styles.ts` exports one token set per style, resolved against the `ResolvedTheme`
(mode, ink, stops):

| Token | Material | Glass | Flat | Outline | Brutalist |
|---|---|---|---|---|---|
| radius (cards/dialogs) | 8 | 24 | 12 | 12 | 0 |
| control shape | MUI default | pill | 12px, no elevation, no ripple glow | outlined | 0px, solid block |
| content fill | paper (today) | paper @ ~55% + blur 20px + saturate 1.6 | background tint (paper mixed toward stop[0]), opaque | transparent | paper, opaque |
| floating fill | paper (today) | paper @ ~35% + blur 12px + saturate 1.8 + lens | as content, one step lighter/darker | transparent + 1px border | paper, opaque |
| border | none / divider (today) | 1px inner highlight: ink @ 0.25 top-left → 0.05 | none | 1px ink @ 0.2 | 2px solid ink |
| shadow | MUI elevation (today) | soft 0 8 32 rgba(0,0,0,.18) + inset specular | none | none | 4px 4px 0 ink, no blur; pressed → none + translate(4,4) |

Exact percentages are the builder's to tune by eye in both modes against a light palette, a dark
palette and a photo; the table fixes the character, not the decimals.

### Applying tokens (`makeTheme`)

`makeTheme(resolved, fontFamily, uiStyle)` adds `styleOverrides` for: `MuiPaper` (content),
`MuiAppBar`, `MuiTabs`, `MuiDrawer` paper, `MuiDialog` paper, `MuiPopover`/`MuiMenu` paper,
`MuiSnackbarContent`, `MuiButton`, `MuiChip`, `MuiToggleButton`, `MuiSwitch`/`MuiSlider` (glass
thumb), plus `shape.borderRadius`. Floating surfaces get the floating tokens via their component
override; a `Paper` that is visually floating outside those components opts in with a
`data-surface="float"` attribute (or a class) the override keys on.

Material's overrides are empty: Material must render identically to today (pin with a test).

Clean up the hand-styled surfaces (8 `bgcolor`/`backdropFilter`/`boxShadow` uses) so none
hard-codes a look the style should own — notably `ThemePage`'s `Section` blur (Q13).

### Liquid Glass specifics

- **Frosted base** everywhere: `backdrop-filter: blur() saturate()` + translucent fill + highlight
  border + inset specular gradient. This alone is the Safari/iOS/Firefox experience and must look
  finished on its own.
- **Lensing** (Chromium only): an SVG filter (`feImage` displacement map → `feDisplacementMap`,
  then blur/saturate) referenced as `backdrop-filter: url(#lens-…)`. The displacement map bends the
  backdrop near the edges only (centre undisplaced), scale subtle (Q15). Maps depend on element size
  and radius; the builder chooses between per-element maps (ResizeObserver) and a few size buckets.
  Mount the `<svg><defs>` once in `App`. Gate on Chromium capability — `CSS.supports` alone is not
  reliable for `url()` backdrop filters, so feature-detect concretely or check engine.
  **First plan task is a lens spike**: prove a convincing subtle lens on the toolbar and a dialog in
  the real app, show the user, then build the rest.
- **Highlights** (Q9/Q16): on `(hover: hover) and (pointer: fine)` and no reduced motion, a
  pointermove listener (rAF-throttled) sets `--glass-x/--glass-y`; the specular radial gradient
  follows them. Otherwise a fixed top-left highlight.
- **Blobs** (Q11): when `uiStyle === 'glass'` and no background image, `backgroundCss` layers 3–4
  large radial gradients in palette colours (primary, secondary, stop shades) over the gradient.
  Static. Other styles unchanged.
- **Floating tab strip** (Q14): in Glass, `MobileTabs`' strip gets horizontal/vertical margin (~8px), pill radius, floating tokens with lensing; the indicator becomes a full-height capsule behind the selected label (brighter glass) instead of the underline. Same position and order as other styles.
- **During a solve** (Q6): `body[data-timing="true"]` already hides toolbar, tabs, side panes,
  scramble and quick actions. Add a global rule that sets `backdrop-filter: none` on any glass
  surface still visible while timing, keeping its translucent fill.
- **Reduced transparency** (Q6): `@media (prefers-reduced-transparency: reduce)` → glass surfaces
  use opaque paper, no blur/lens.

### Theme page (Q7)

New **Style** section under Mode: a grid of five preview cards (`aria-pressed`, like palette
cards). Each card renders a miniature (a small panel + a button + a pill) inside a box painted with
the current background, styled with that style's tokens (nested `ThemeProvider` per card), so the
preview is exact. Labels: "Material", "Liquid Glass", "Flat", "Outline", "Brutalist" (i18n keys).

## Constraints

- MUI v6+ with Emotion, React, Capacitor (iOS WKWebView, Android WebView), PWA offline.
- No new runtime dependencies expected.
- Contrast: body text on every content surface ≥ 4.5:1 for every preset × mode; checked by a test
  that computes the effective surface colour (fill composited over the gradient's stops) — the
  existing `contrastRatio` helper is reusable. Over a user photo, the existing dim is the safeguard.
- Performance: no layout thrash from the highlight listener; glass on a long times list must scroll
  smoothly on a mid-range Android phone (manual check on the device the user has).

## Verification

- Unit: settings sanitising for `uiStyle`; token resolution per style/mode; contrast test above;
  Material theme output unchanged.
- E2E: picking each style persists across reload and changes a surface's computed style
  (radius/border/backdrop-filter); timing removes backdrop-filter; reduced-transparency emulation
  gives opaque surfaces; Material default leaves existing screenshots/CSS assertions intact.
- Visual: screenshots of each style in light + dark, with and without photo, desktop + mobile,
  reviewed by eye (and shown to the user) before merging.

## Left to the builder

- Exact opacity/blur/saturation numbers and highlight gradients (tune by eye, both modes).
- Lens map generation strategy and Chromium detection method (after the spike).
- How floating `Paper`s outside MUI's floating components are marked.
- Preview-card miniature composition.
