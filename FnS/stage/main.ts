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

const params = new URLSearchParams(location.hash.replace(/^#/, ''));
const embed = params.get('embed') === '1' || new URLSearchParams(location.search).get('embed') === '1';

let session: Session;
let loadError = '';
if (location.hash.length > 1) {
  try {
    session = Session.load(location.hash);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
    session = new Session();
  }
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
window.addEventListener('keydown', (e) => {
  if (e.target === input) {
    if (e.key === '`') {
      e.preventDefault();
      setConsole(false);
    }
    return;
  }
  if (e.key === '`') {
    e.preventDefault();
    setConsole(panel.hidden);
  } else if (e.key === '/') {
    e.preventDefault();
    setConsole(true);
  } else if (e.key === ' ') {
    e.preventDefault();
    runLine(session.playing ? 'pause' : 'play');
  } else if (e.key === '[' || e.key === ']') {
    // slow motion, to watch (or teach) the beats one by one
    e.preventDefault();
    const next = e.key === '[' ? session.speed / 2 : session.speed * 2;
    runLine(`speed ${Math.min(4, Math.max(1 / 16, next))}`);
  }
});
if (embed) setConsole(false);

// ——— pointer ———

let holding = false;
canvas.addEventListener('pointerdown', (e) => {
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
function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.05;
  session.frame(dt);
  view.render(session, dt, now);
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
