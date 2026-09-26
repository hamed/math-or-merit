/**
 * `notes/prose.md` → messages.
 *
 * The owner writes every reader-facing word in `notes/prose.md` and nowhere
 * else. This is the bridge that carries the script into Paraglide's message
 * file, so the words in the build are the words in his file by construction —
 * `messages/en.json` is generated from it (`scripts/prose-to-messages.ts`) and a
 * test fails the moment the two drift apart.
 *
 * Only the script is read: everything above "# Appendix". The retiring
 * narrator lines below it never reach the build. Headless and pure; no fs here.
 */

export type Speaker = 'blue' | 'red';

export interface ProseLine {
  /** The tag as written in prose.md, e.g. `intro.blue`. */
  readonly tag: string;
  /** The message key, e.g. `intro_blue`. Dots become underscores. */
  readonly key: string;
  readonly speaker: Speaker | null;
  /** The words, with provenance markers and markdown emphasis stripped. */
  readonly text: string;
  /** Owner-approved wording (★). */
  readonly approved: boolean;
  /** A `·`-separated list — reel words, call-out pools — split into parts. */
  readonly parts: readonly string[] | null;
}

/** The ceiling the brief sets for one bubble in English (4.3). */
export const MAX_BUBBLE_WORDS = 18;
/** The aim, not a rule. */
export const AIM_BUBBLE_WORDS = 12;
/**
 * Two lines at bubble width, as characters — the per-locale budget (A2). A
 * proxy for measured width, which needs a browser: it is checked on every
 * locale, and a line near it gets measured on screen.
 */
export const MAX_BUBBLE_CHARS = 96;

const TAG_LINE = /^\[([a-z0-9.]+)\]\s+(.*)$/;
const SPEAKER = /^(BLUE|RED):\s*/;
const PROVENANCE = /^\((?:draft)[^)]*\)\s*/;

export function scriptSection(prose: string): string {
  const cut = prose.search(/^# Appendix/m);
  return cut === -1 ? prose : prose.slice(0, cut);
}

export function tagToKey(tag: string): string {
  return tag.replace(/\./g, '_');
}

/**
 * One entry per tagged paragraph. A paragraph is a tag line plus the lines that
 * follow it up to a blank line, a picture note, a claim or an adapt note.
 * Lines still marked OPEN are placeholders and are not messages yet.
 */
export function parseProse(prose: string): ProseLine[] {
  const lines = scriptSection(prose).split('\n');
  const out: ProseLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = TAG_LINE.exec(lines[i]);
    if (!match) continue;
    const body = [match[2]];
    while (i + 1 < lines.length && lines[i + 1].trim() !== '' && !/^[>!~[]/.test(lines[i + 1])) {
      body.push(lines[++i].trim());
    }
    let text = body.join(' ').trim();
    if (text.startsWith('OPEN')) continue;

    let speaker: Speaker | null = null;
    const said = SPEAKER.exec(text);
    if (said) {
      speaker = said[1] === 'BLUE' ? 'blue' : 'red';
      text = text.slice(said[0].length);
    }
    text = text.replace(PROVENANCE, '');
    const approved = /★\s*$/.test(text);
    text = text.replace(/\s*★\s*$/, '').trim();
    // In a bubble `**…**` is said louder (the bubble renders it); anywhere
    // else it is only the author's emphasis.
    if (speaker === null) text = text.replace(/\*\*/g, '');

    // A `·` list is a set of separate things to say — reel words, a pool of
    // call-outs. A parenthesised line is one thing that happens to use the
    // dot as punctuation: "(on paper · Reuters · June 14, 2026)".
    const isList = text.includes(' · ') && !text.startsWith('(');
    const parts = isList ? text.split(' · ').map((part) => part.trim()) : null;
    out.push({ tag: match[1], key: tagToKey(match[1]), speaker, text, approved, parts });
  }
  return out;
}

/** Bubbles: anything a character says, and the circles' call-outs. */
export function isBubble(line: ProseLine): boolean {
  return line.speaker !== null || line.tag.startsWith('call.');
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * The message file, in script order. A `·` list becomes numbered messages
 * (`open_reel_merit_1` …), because a translator translates words, not a list
 * the code has to split.
 */
export function toMessages(lines: readonly ProseLine[]): Record<string, string> {
  const messages: Record<string, string> = {
    $schema: 'https://inlang.com/schema/inlang-message-format',
  };
  for (const line of lines) {
    if (line.parts) {
      line.parts.forEach((part, index) => {
        messages[`${line.key}_${index + 1}`] = part;
      });
    } else {
      messages[line.key] = line.text;
    }
  }
  return messages;
}
