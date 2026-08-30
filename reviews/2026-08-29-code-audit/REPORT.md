# Code and cross-device audit — findings only

Date: 2026-08-29  
Reviewed revision: `9f7971a` plus the working tree present at review time

## Scope

This pass covers implementation behavior, responsive layout, input modes,
accessibility mechanics, runtime correctness, performance, architecture,
cleanliness, redundancy, comments, and test/release tooling. It deliberately
does **not** review the essay's prose, claims, message, visual taste, or other
content. It also deliberately contains no fixes or recommendations; those are
reserved for the requested second pass.

The existing dirty working tree was treated as user-owned and left untouched.
The only repository addition from this audit is this report.

## Coverage and baseline

- Read the application, widgets, simulation/research layers, shared utilities,
  styles, tests, build configuration, deployment workflow, and accepted ADRs.
- Ran 22 Chromium viewport profiles: phone widths from 320 to 430 CSS px in
  portrait, short phone landscape from 568×320 through 915×412, portrait and
  landscape tablets, desktops from 1280×720 through 2560×1080, and reduced-
  motion variants.
- Exercised keyboard focus, custom controls, persisted state, and expert-mode
  inputs in the running application.
- `npm test -- --run`: pass, 20 test files and 175 tests.
- `npm run build`: pass, with two Svelte accessibility warnings and one unused
  CSS-selector warning.
- `npx tsc --noEmit`: fail, 33 errors in
  `src/lib/widgets/stage/beats.test.ts` (15 invalid named `.svelte` exports and
  18 implicit-`any` parameters).
- `npm audit --offline`: no known vulnerability in the installed lockfile.
- Production output: 4.3 MiB overall, including about 3.80 MiB of WebP images,
  one 356 kB JavaScript chunk, and one 41 kB CSS file.

Firefox was available only through a confined Snap and did not produce a
headless test artifact in this environment. Safari/WebKit and physical mobile
hardware were unavailable. The runtime observations below are therefore
Chromium observations; cross-engine guarantees are not claimed.

## Severity

- **High** — a reachable crash, incorrect result, severely broken mainstream
  viewport/input path, or substantial release/performance risk.
- **Medium** — a material accessibility, reliability, architecture, or
  maintenance defect that is not an immediate mainstream failure.
- **Low** — localized inconsistency or debt with limited present impact.

## Findings

### High — the sandbox collapses in common short landscape viewports

`src/lib/widgets/sandbox/Sandbox.svelte:684-713` forces the full sandbox into a
five-column, one-viewport-high grid. The alternative layout is selected only
for portrait orientation or widths at most 44 rem
(`Sandbox.svelte:985-1003`). This creates an abrupt cliff just above roughly
704 CSS px: 667×375 is a readable stacked page, while 844×390 and 915×412 use
the dense desktop grid. At 844×390 the room becomes a very shallow strip,
controls and chart labels are compressed to near-illegibility, and much of the
screen remains poorly allocated. These are ordinary modern-phone landscape
dimensions, not an edge case.

### High — the exposed start-money input can crash the sandbox

Expert mode accepts any finite raw number in
`src/lib/widgets/sandbox/StopSlider.svelte:54-59`. Because the field is bound
to `startDollars`, the parent value has already become `0` before
`setStartDollars` conditionally rejects it and unconditionally calls `reset`
(`Sandbox.svelte:242-245`, `565-569`). `SandboxWorld` then throws because start
money must be positive (`SandboxWorld.ts:146-150`). Entering `0` reproduced an
uncaught `RangeError: startDollars must be positive` in Chromium. Negative
values follow the same path.

### High — simulation rate and game difficulty depend on display refresh rate

The shared ticker supplies elapsed time
(`src/lib/widgets/shared/ticker.ts:8-16`), but several consumers ignore it and
advance a fixed number of trades per rendered frame:

- sandbox: `Sandbox.svelte:209-225`;
- stake dial: `src/lib/widgets/dial/StakeDial.svelte:39-47`;
- phase room: `src/lib/widgets/phase/PhaseDiagram.svelte:78-101`;
- tax game: `src/lib/widgets/tax/TaxGame.svelte:12-15`, `63-72`;
- time lapse: `src/lib/widgets/ending/TimeLapse.svelte:58-67`.

Consequently a 120 Hz device simulates roughly twice as many trades per second
as a 60 Hz device. The tax game's “about four seconds” loss condition is 240
frames, making it about two seconds at 120 Hz and eight seconds at 30 Hz. The
time lapse multiplies its acceleration by `1.06` on every frame, so refresh
rate changes both its acceleration curve and completion time. Background-tab
throttling changes the same behavior again. This is device-dependent program
logic, not merely a smoother or rougher animation.

### High — long-run chart history develops an incorrect time axis

`RoundSeries` halves stored samples and doubles `_stride` when full
(`src/lib/widgets/sandbox/SandboxWorld.ts:70-87`). After `_stride` exceeds 1,
however, new raw rounds are still combined only in pairs (`73-78`). At stride
4, a new plotted point therefore represents two rounds while `roundOf()`
advances its x position by four (`65-68`). After round 2050, for example, the
new point contains rounds 2049–2050 but is labeled round 2052. By the next
compaction, samples representing different interval sizes are averaged
together and the error becomes much larger. `TimeSeries.svelte` uses
`roundOf()` for paths and peak labels, so sufficiently long sandbox runs report
the wrong chronology. The existing compression test stops exactly at the first
boundary and does not exercise post-boundary pushes.

### High — phase-map filling can monopolize the main thread and survives unmount

`src/lib/widgets/phase/PhaseDiagram.svelte:115-156` checks its 24 ms frame
budget only between complete cells. Each cell performs two synchronous
`runPhaseCell` calls of 200,000 trades, so one budget iteration can execute
400,000 trades before yielding; filling the untouched 10×13 grid represents
about 52 million trades. On slower mobile CPUs this creates long tasks despite
the comment claiming a sub-30 ms budget. The recursive animation-frame handle
is discarded and the component cleanup at line 182 stops only the live ticker,
so fill work can continue after navigation/unmount.

### High — the phase surface combines non-equivalent measurements

A manually played phase cell samples Gini once per rendered frame after burn-
in and averages those samples (`PhaseDiagram.svelte:80-96`). Its frame-fixed
1,500-trade cadence means the sample count and final overshoot are tied to the
animation loop. Auto-filled cells instead use `runPhaseCell` with eight evenly
spaced tail samples and two fixed seeds (`131-143`). Auto-fill skips any cell
already played, so the resulting contour can permanently combine one live,
single-seed, refresh-sensitive estimator with a different two-seed estimator.
The map looks like one dataset while its cells do not share one measurement
contract.

### High — the time-lapse handoff does not continue the room the reader ran

The reveal creates a fresh random seed for every run and records its resulting
wealth (`src/lib/widgets/reveal/RevealRun.svelte:26-28`, `133-140`). The later
time lapse always reconstructs a separate fixed `REVEAL_SEED` world
(`src/lib/widgets/ending/TimeLapse.svelte:17-29`). The code comment says it
continues the room left by the reveal, but there is no data dependency between
the two widgets. The visible transition is therefore a state discontinuity.

### High — below-the-fold scenes impose eager startup network and decode cost

The essay directly imports every widget at module load
(`src/content/essay.en.svx:2-18`). The cow scene imports eleven WebPs and the
person scene imports eleven more
(`CowCastScene.svelte:4-14`, `PersonTradeScene.svelte:4-14`). On mount,
`PinScene` additionally creates an `Image` for every plate and calls `decode()`
immediately (`src/lib/widgets/stage/PinScene.svelte:184-205`). The production
build is a single eager JavaScript chunk plus about 3.80 MiB of image assets.
Mobile readers pay network, decode, and memory costs for distant scenes before
reaching them.

### High — the deployment gate publishes a type-invalid build

The strict TypeScript run currently fails with 33 errors, while `npm run build`
still exits successfully. `package.json:5-11` has no type-check or Svelte-check
script, and `.github/workflows/deploy.yml:35-45` runs only unit tests and Vite
build before publishing. The same build also emits two click-without-keyboard
warnings from `PlotFrame.svelte` and an unused-selector warning from
`PinScene.svelte`, all non-fatal. The release pipeline can therefore deploy a
tree that fails its configured type checker and known framework diagnostics.

### High — plot controls claim button semantics but are keyboard-inaccessible

The SVG axis and body hit areas in
`src/lib/widgets/sandbox/PlotFrame.svelte:164-194` use `role="button"`, click
handlers, and `tabindex="-1"`, with no keyboard handlers. Axis scale toggles
and body-mode cycling cannot be reached from the keyboard. Svelte reports this
twice during every build. The surrounding plot can receive Enter for zoom, but
that does not expose the distinct axis/body actions.

### Medium — the custom radio group does not implement radio keyboard behavior

All four prediction buttons have `role="radio"` and remain in the tab order
(`src/lib/widgets/predict/Prediction.svelte:49-64`). Chromium confirmed four
radio roles with `tabIndex=0` and no native radio inputs. There is no arrow-key
navigation or roving tab stop. A keyboard user must tab through every option,
and the control's behavior does not match the semantics it advertises.

### Medium — the full-screen news dialog has no focus lifecycle

`src/lib/widgets/sandbox/NewsFlash.svelte:43-62`, `68-106` renders a full-screen
overlay with `role="dialog"`, but does not mark it modal, move focus into it,
contain focus, or restore focus when it closes. Background controls remain in
the document tab order. The first dialog button is the invisible full-screen
backdrop rather than the visible action. The visual modal and keyboard focus
model can therefore disagree.

### Medium — pointer-only room interactions have no equivalent input path

`src/lib/widgets/shared/RoomCanvas.svelte:131-146`, `182-187` exposes the canvas
as `role="img"` and handles agent selection only through `pointerdown`.
Sandbox's per-agent levy passes exclusively through this `onTap` path
(`src/lib/widgets/sandbox/Sandbox.svelte:509-517`). The finale therefore makes
a named core interaction unavailable to keyboard and switch-device users.

### Medium — dense controls are below comfortable mobile touch size

Sandbox fieldset and toolbar buttons have a minimum height of only 1.9 rem
(`Sandbox.svelte:937-949`); icon controls can be 2.2 rem wide (`970-975`). The
runtime matrix measured many high-frequency controls around 28–35 CSS px in
one or both dimensions, including the keypad, look control, axis hit zones,
and chart controls. The short-landscape layout packs these targets especially
closely, increasing accidental activation risk.

### Medium — small screens displace the opening's viewport-owned scene

At widths up to 40 rem, `src/app.css:194-197` adds 2.5 rem of top padding to
the whole essay shell. The opening scene itself owns a full viewport. Runtime
measurement at 320×568, 390×844, and 568×320 placed that scene 40 px below the
viewport and its lower edge 40 px beyond it. The first-screen contract is thus
broken specifically on phones and short landscape screens.

### Medium — there is no browser-level regression suite

The 20 test files are Vitest/unit tests. There is no Playwright, WebDriver,
Cypress, or Puppeteer dependency/configuration and no browser job in CI.
Responsive breakpoints, rotation, reduced motion, canvas interaction, focus,
dialogs, animation timing, storage, and the expert-mode crash are not exercised
by the release gate. The green 175-test result provides no coverage of the
main device and interaction risks found in this audit.

### Medium — `Sandbox.svelte` has become a low-cohesion orchestration hub

At 1,013 lines, `src/lib/widgets/sandbox/Sandbox.svelte` owns simulation
lifecycle, measurement/stability detection, persistence import/export, file
downloads, keyboard handling, news state, modal invocation, scroll settling,
responsive layout, seven chart modes, all controls, and most styling. Changes
to unrelated concerns converge on one component. Its `SandboxPanels`,
`SandboxControls`, and `layout` configuration (`lines 8-60`) introduce many
conditional paths, yet the only production call is the default `<Sandbox />`
at `src/content/essay.en.svx:482`. The accepted preset abstraction currently
adds branching surface without actual preset consumers.

### Medium — accepted widget boundaries and current composition disagree

ADR 005 and `AGENTS.md` require a uniform `mount / config / events / cleanup`
contract behind a generic `WidgetSlot`. No `WidgetSlot` or corresponding
contract implementation exists in `src`; the essay directly imports and
instantiates every widget (`essay.en.svx:2-18`). ADR 014 separately says earlier
beats become sandbox presets, while the current code keeps separate widget
implementations and leaves the sandbox preset interface unused. There is no
forbidden widget-identity branch in the engine today, but the documented
architecture and the executable architecture are materially different.

### Medium — public modules bypass the simulation's intended internal boundary

`YardSaleTrade` lives under `src/lib/sim/internal`, but is imported directly by
`src/lib/research/weightedAccess.ts`, `studies.ts`, `network.ts`, `phase.ts`, and
`src/lib/widgets/sandbox/SandboxWorld.ts`. These modules reproduce their own
pair-selection and stepping loops around the primitive instead of depending on
the public `SimEngine` boundary. That broadens the future JavaScript/WASM seam
and duplicates core orchestration outside the boundary named by the project.

### Medium — `SandboxWorld` keeps a mutable caller-owned configuration

`src/lib/widgets/sandbox/SandboxWorld.ts:146-150` validates a configuration and
then stores the original object by reference. Later stepping and reset logic
reads `this.config.n` and `this.config.startDollars` (`206`, `273`). A caller can
mutate the object after construction, making `n` disagree with the allocated
typed-array lengths or changing reset accounting without revalidation. The
public engine freezes its configuration snapshot; this adjacent world does
not share that invariant.

### Medium — persisted/imported phase data has no structural or range validation

`src/lib/widgets/sandbox/phaseGrid.svelte.ts:49-58` assigns arbitrary parsed
JSON directly to the reactive cell store. `importCsv` (`131-150`) accepts any
finite stake, tax, population, Gini, and count; it does not require integer
positive populations/counts or bounded Gini/rates. `pointsFor` subsequently
assumes each value has numeric `sum` and `count`. Malformed local storage can
silently poison plots, and a syntactically valid CSV can introduce nonsensical
measurements into the persistent dataset.

### Low — full-bleed width is shifted by the desktop scrollbar

The full sandbox uses `inline-size: 100vw` and centers that width inside its
container (`Sandbox.svelte:684-688`) while the page clips horizontal overflow.
On desktop Chromium with a classic 15 px scrollbar, runtime bounds were about
`-7.5px` to `innerWidth - 7.5px`. One side is clipped and the visual center is
shifted by half the scrollbar width.

### Low — dead branches, placeholders, and history comments obscure current code

Examples include:

- four `OpeningLayout` variants retained “for the owner's pick” even though no
  caller supplies a layout, plus empty variant CSS sections
  (`OpeningScene.svelte:34-42`, `114-118`, `420-441`);
- a zero-stake branch in `StakeDial.svelte:39-45` even though the exposed input
  has `min="1"` (`95-101`);
- a disabled `progressivity` placeholder and configuration branch in
  `Sandbox.svelte:575-578`;
- duplicated adjacent explanations of sandbox scroll offset at
  `Sandbox.svelte:694-700`;
- a long dated incident narrative embedded in production CSS at
  `src/app.css:382-392`, plus widespread “owner review”/audit-history comments
  throughout runtime files;
- duplicated classic agent colors in `Sandbox.svelte:88-90` and
  `NewsFlash.svelte:28-30`, while the global palette separately states that it
  must be manually kept in sync with `agentStyle.ts` (`src/app.css:17-30`).

These comments and branches preserve decision history inside executable files
rather than describing only present invariants. Several already coexist with
contradictory current behavior, such as “exactly a screen tall” beside the
portrait rule that changes the sandbox height to `auto`.

### Low — a known dead CSS rule ships in the bundle

The production build reports
`src/lib/widgets/stage/PinScene.svelte:501` (`.pin-scene.over-art
:global(.stage-caption)`) as unused. It remains in shipped CSS and indicates
that class/state handling and the stylesheet are no longer fully synchronized.

## Overall assessment

The headless simulation tests are healthy, and the logical-CSS/RTL reservation
is consistently observed. The application is not yet behaviorally consistent
across the requested device/input range: short phone landscape, high-refresh
displays, keyboard-only use, long-running charts, and slower mobile CPUs expose
independent high-severity failures. The largest process risk is that the
current deployment gate cannot see any of those failures and does not even
reject the repository's present strict-TypeScript errors.
