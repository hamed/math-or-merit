# AGENTS.md

## Project

Interactive explorable explanation of the Yard-Sale wealth-condensation model.

Working title: **Math or Merit?**

Tone: prose-dominant educational essay with inline interactive widgets, in the spirit of Nicky Case-style explorable explanations.

Core hook: a fair local exchange process can still produce extreme wealth concentration.

## Stack

* Vite
* Svelte 5 with runes
* TypeScript
* Plain CSS
* mdsvex for prose with components
* Paraglide / inlang for UI strings only
* Rust/WASM is reserved as a future seam, not active now

## Commands

* Install: `npm install`
* Run locally: `npm run dev`
* Build: `npm run build`

## Core law

Manage coupling and cohesion so the cost of any likely change stays local. Everything else is a corollary.

## Architecture boundaries

These are one-way-door decisions. Do not relitigate them casually.

### Simulation core

`SimEngine` is the boundary.

Dependencies point inward:

* Svelte may import the simulation.
* The simulation must never import Svelte.
* The simulation core must stay headless, framework-agnostic, and unit-testable in milliseconds.

### State layout

Simulation state uses `Float64Array` in a struct-of-arrays layout.

Do not replace this with arrays of objects.

Reason:

* fast in JavaScript
* compatible with native Rust/WASM layout
* cheap across a future WASM boundary

### Engine versus content

There is one engine.

Text, notes, widgets, audio, translations, and cross-links are data flowing through it.

The engine must not grow with the content.

### Widget contract

Widgets are deep modules behind a small interface:

* mount
* config
* events
* cleanup

The engine may know the widget contract. It must not know individual widget implementations.

### CSS and directionality

Use logical CSS:

* `margin-inline-start`
* `margin-inline-end`
* `padding-inline`
* `text-align: start`
* `text-align: end`

Direction is controlled by one `dir` attribute from the active locale.

This preserves the future Persian/RTL path without redesigning layout.

## Critical failure mode

Do not add logic like this in `WidgetSlot`, the engine, or the simulation core:

```ts
if (widgetType === 'specificWidget') {
  ...
}
```

That feels fast, but it spends the engine's simplicity. Guard this boundary.

## Where nonlinearity is allowed

Allowed:

* prose-layer navigation through anchors and notes
* widget-internal state machines
* cross-links in content data
* ordered manifests with graph-like links between content units

Not allowed:

* branching inside the engine
* branching inside the simulation core for specific content or widget types

## Human/agent split

Human owns irreversible boundaries:

* state shape
* contracts
* simulation interface
* dependency direction
* architecture seams

Agent owns regenerable interiors:

* widget bodies
* prose rendering
* styling
* local refactors
* tests
* small component implementation

Encode intent as types, schemas, and fast tests. Those are the checks the agent should obey instead of relying on memory.

## Discipline

* Build one-way-door boundaries now while context is loaded.
* Wait for the rule of three before abstracting, unless the axis of variation is already known.
* Known variation axes: content growth, languages, media, widgets.
* Additive content should keep the project shippable at every size.
* Do not leave half-built content systems that block shipping.

## Deferred seams

Reserved but do not build yet:

* Rust/WASM simulation core
* Persian translation
* RTL polish beyond logical CSS readiness
* per-unit audio
* full translation workflow

Translate last, after the English version stabilizes.
