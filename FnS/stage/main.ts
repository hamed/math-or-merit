/**
 * The page: canvas, dev console, pointer. Everything that thinks lives in
 * Session (headless); this file forwards keys and pointers and draws.
 *
 *   `  or the ›_ button   toggle the console
 *   /                     focus the console
 *   space                 play / pause trading
 *   [ ]                   slower / faster (everything: walking, trades, levies)
 *   click                 who is this; drag pushes through the crowd
 *
 * Devtools: window.fns.session is the live session, window.fns.run(line) runs
 * a console line.
 */
import { Session, VOCABULARY } from './console/session.ts';
import { parseRecipe } from './core/recipe.ts';
import { setFavicon } from './view/favicon.ts';
import { fontsReady } from './view/logo.ts';
import { awaitFonts } from './view/fonts.ts';
import { keyAction, type KeyTarget, type OpeningState } from './view/keys.ts';
import { BUTTONS, Opening, castOf, drawHeader, headerHeight, measureType, type Box } from './view/opening.ts';
import { StageView } from './view/render.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('stage');
const hud = $<HTMLOutputElement>('hud');
const question = $<HTMLParagraphElement>('question');
const caption = $<HTMLParagraphElement>('caption');
const panel = $<HTMLElement>('console');
const log = $<HTMLPreElement>('log');
const form = $<HTMLFormElement>('prompt');
const input = $<HTMLInputElement>('cmd');
const toggle = $<HTMLButtonElement>('toggle');
const byline = $<HTMLAnchorElement>('byline');
/** The controls over the drawn buttons, in BUTTONS' order. */
const menu = BUTTONS.map((b) => document.querySelector<HTMLElement>(`#menu [data-go="${b.id}"]`)!);

const params = new URLSearchParams(location.hash.replace(/^#/, ''));
const search = new URLSearchParams(location.search);
const embed = params.get('embed') === '1' || search.get('embed') === '1';
/** A fresh visit opens with the logo (owner, 2026-10-18); a link, an embed or ?opening=0 goes straight to the stage; ?opening=7.5 starts it 7.5 s in. */
const opens = location.hash.length <= 1 && !embed && search.get('opening') !== '0';
const openAt = Math.max(0, Number(search.get('opening')) || 0);

let session: Session;
let loadError = '';
if (location.hash.length > 1) {
  try {
    session = Session.load(location.hash);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
    session = new Session();
  }
} else if (opens) {
  // the opening ends on sixteen equal shares folded into the box, 4 × 4: the stage starts there
  session = new Session({ n: 16, recipe: parseRecipe('fold') });
} else {
  // calm by default: everyone spread out and standing; space starts the trading
  session = new Session();
}
if (embed) {
  session.hud = false;
  document.body.classList.add('embed');
}
session.print('Fair and Square — stage and dev console. Nothing here is for readers yet.');
session.print('try: demo · play · trade 2000 · ccdf · neff · classes · quartiles · room · zoom chart · drag lift · still · fx off · help');
if (loadError) session.print(`error: link not loaded (${loadError}); fresh room instead`);

const view = new StageView(canvas);
setFavicon();

// ——— the opening, and the title it leaves outside the yard ———

let opening: Opening | null = null;
/** Waiting for the fonts before the opening can start. */
let waiting = opens;
/** Where the name was drawn last frame: the link to the about page sits over it. */
let named: Box | null = null;
/** Where the buttons on the line above the yard were drawn last frame. */
let buttons: Box[] = [];
// the fonts, or not: failing or late (4 s), the stage goes on without the opening, and a late title still comes in
awaitFonts(fontsReady(), 4000, {
  ready() {
    const type = measureType();
    view.ornament = {
      draw(ctx, frame) {
        const line = drawHeader(ctx, type, frame, session.playing);
        named = line.name;
        buttons = line.buttons;
      },
      height: (frame) => headerHeight(type, frame),
    };
    const who = waiting ? castOf(session) : null;
    if (who) {
      opening = new Opening(canvas, session, view, type, who);
      if (openAt > 0) opening.seek(openAt);
    }
    waiting = false;
  },
  failed() {
    if (!waiting) return;
    waiting = false;
    session.print('the lettering did not load: no opening, straight to the stage');
    renderLog();
  },
});
/** Straight to the stage: Escape, or a command, during the opening. */
function skipOpening(): void {
  waiting = false;
  opening?.skip();
}
/** A control over something drawn: the canvas draws it, the control makes it one (focus, screen readers, a click). */
function place(el: HTMLElement, box: Box | null): void {
  el.hidden = !box;
  if (!box) return;
  const r = canvas.getBoundingClientRect();
  el.style.left = `${r.left + box.x0}px`;
  el.style.top = `${r.top + box.y0}px`;
  el.style.width = `${box.x1 - box.x0}px`;
  el.style.height = `${box.y1 - box.y0}px`;
}
// Play: beside the held logo it starts the game, while the logo unfolds it skips to the end, and on the line
// above the yard it plays and pauses the trading. About opens the about page; the rest have nowhere to go yet.
const play = menu[BUTTONS.findIndex((b) => b.id === 'play')];
play.addEventListener('click', () => {
  if (opening) {
    if (!opening.started) opening.start();
    else skipOpening();
  } else runLine(session.playing ? 'pause' : 'play');
});

/** A click, a tap, Space or Enter: the held logo starts unfolding; once it is, straight to the stage. */
function startOrSkip(): void {
  if (opening && !opening.started) opening.start();
  else skipOpening();
}
(window as unknown as { fns: unknown }).fns = { session: () => session, run: (line: string) => runLine(line) };

// ——— console ———

const typed: string[] = [];
let cursor = 0;
let shown = -1;

// help lays itself out to the console's width: count the characters that fit
const measure = document.createElement('span');
measure.textContent = 'MMMMMMMMMM';
measure.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
log.append(measure);
function fitColumns(): void {
  const char = measure.getBoundingClientRect().width / 10 || 7;
  const inner = log.clientWidth - 24;
  if (inner > 0) session.columns = Math.max(24, Math.floor(inner / char));
}
new ResizeObserver(fitColumns).observe(log);

function renderLog(): void {
  if (session.log.length === shown && log.dataset.n === String(session.log.length)) return;
  shown = session.log.length;
  log.dataset.n = String(shown);
  log.textContent = session.log.join('\n');
  log.append(measure);
  log.scrollTop = log.scrollHeight;
}

function runLine(line: string): string {
  skipOpening();
  const out = session.run(line);
  if (/^share\b/.test(line.trim())) history.replaceState(null, '', session.share());
  shown = -1;
  renderLog();
  return out;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const line = input.value.trim();
  if (!line) return;
  if (typed[typed.length - 1] !== line) typed.push(line);
  cursor = typed.length;
  input.value = '';
  runLine(line);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    cursor = Math.max(0, Math.min(typed.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)));
    input.value = typed[cursor] ?? '';
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const words = input.value.split(' ');
    const last = words[words.length - 1].toLowerCase();
    const options = [...new Set(VOCABULARY.filter((w) => w.startsWith(last)))];
    if (options.length === 1) {
      words[words.length - 1] = options[0];
      input.value = `${words.join(' ')} `;
    } else if (options.length > 1) {
      session.print(options.join('  '));
      renderLog();
    }
  } else if (e.key === 'Escape') {
    input.blur();
  }
});

function setConsole(open: boolean): void {
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) input.focus();
}
toggle.addEventListener('click', () => setConsole(panel.hidden));
// a click anywhere on the console types into it (unless text is being selected to copy)
panel.addEventListener('mouseup', () => {
  if (!window.getSelection()?.toString()) input.focus();
});
/** Where a key was pressed, and how far the opening has got, for keyAction. */
function keyTarget(t: EventTarget | null): KeyTarget {
  if (t === input) return 'console';
  return t instanceof Element && t.closest('button, a[href], a[aria-disabled], select, textarea') ? 'control' : 'page';
}
function openingState(): OpeningState {
  if (waiting) return 'waiting';
  if (!opening) return 'none';
  return opening.started ? 'unfolding' : 'held';
}
window.addEventListener('keydown', (e) => {
  const action = keyAction(e.key, keyTarget(e.target), openingState());
  // a focused button or link presses itself (its own click does the rest)
  if (action === 'native' || action === 'none') return;
  e.preventDefault();
  if (action === 'start') startOrSkip();
  else if (action === 'skip') skipOpening();
  else if (action === 'toggle-console') setConsole(panel.hidden);
  else if (action === 'focus-console') setConsole(true);
  else if (action === 'play-pause') runLine(session.playing ? 'pause' : 'play');
  else {
    // slow motion, to watch (or teach) the beats one by one
    const next = action === 'slower' ? session.speed / 2 : session.speed * 2;
    runLine(`speed ${Math.min(4, Math.max(1 / 16, next))}`);
  }
});
if (embed) setConsole(false);

// ——— pointer ———

let holding = false;
canvas.addEventListener('pointerdown', (e) => {
  if (opening || waiting) {
    startOrSkip();
    return;
  }
  const [x, y] = view.toWorld(e.clientX, e.clientY);
  const i = session.stage.pick(x, y);
  session.selected = i;
  if (i < 0) return;
  if (!embed) runLine(`who ${i}`);
  if (session.drag !== 'off' && session.stage.grab(i, session.drag === 'lift')) {
    holding = true;
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!holding) return;
  const [x, y] = view.toWorld(e.clientX, e.clientY);
  session.stage.drag(x, y);
});
const drop = () => {
  if (!holding) return;
  holding = false;
  session.stage.release();
};
canvas.addEventListener('pointerup', drop);
canvas.addEventListener('pointercancel', drop);

// ——— frame ———

let last = performance.now();
let fps = 60;
let hudAt = 0;
/** How far down the canvas the console's toggle reaches, where it lies over it (portrait): the title line keeps below it. */
function toggleOver(): number {
  if (toggle.hidden || getComputedStyle(toggle).display === 'none') return 0;
  const t = toggle.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();
  const over = t.right > c.left && t.left < c.right && t.bottom > c.top && t.top < c.bottom;
  return over ? t.bottom - c.top + 4 : 0;
}

function frame(now: number): void {
  view.clearTop = toggleOver();
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.05;
  if (opening || waiting) {
    // the opening has the canvas; the stage waits, folded in the box, and takes over with its faces
    if (opening) {
      opening.frame(dt);
      place(byline, opening.byline);
      menu.forEach((el, k) => place(el, opening?.controls[k] ?? null));
      if (opening.done) {
        // its faces go on only in the stage it was made for: a command may have rebuilt it meanwhile
        if (opening.belongsTo(session)) view.adopt(opening.field, session);
        opening = null;
      }
    }
    hud.hidden = question.hidden = caption.hidden = true;
    renderLog();
    requestAnimationFrame(frame);
    return;
  }
  session.frame(dt);
  view.render(session, dt, now);
  place(byline, named);
  menu.forEach((el, k) => place(el, buttons[k] ?? null));
  // Play's name says what it will do, as its cue does
  const label = session.playing ? 'Pause' : 'Play';
  if (play.textContent !== label) play.textContent = label;
  if (session.question) {
    question.hidden = false;
    question.textContent = session.question;
  } else question.hidden = true;
  caption.hidden = !session.caption;
  if (caption.textContent !== session.caption) caption.textContent = session.caption;
  hud.hidden = !session.hud;
  if (session.hud && now - hudAt > 250) {
    hudAt = now;
    const o = session.stage.overlaps();
    const where = session.stage.posing ? (session.stage.done ? 'in place' : 'moving') : 'wandering';
    const script = session.script ? ` · script ${session.script.name}` : '';
    const pace = session.speed !== 1 ? ` · speed ${+session.speed.toFixed(4)} ([ ])` : '';
    hud.textContent = `n ${session.game.n} · trades ${session.game.trades}${session.playing ? ' ▸' : ''} · ${where}${script}${pace} · overlaps ${o.pairs} · ${Math.round(fps)} fps`;
  }
  renderLog();
  requestAnimationFrame(frame);
}
renderLog();
requestAnimationFrame(frame);
