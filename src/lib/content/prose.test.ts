import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MAX_BUBBLE_CHARS,
  MAX_BUBBLE_WORDS,
  isBubble,
  parseProse,
  tagToKey,
  toMessages,
  wordCount,
} from './prose';

const prose = readFileSync('notes/prose.md', 'utf8');
const lines = parseProse(prose);

describe('prose.md is the source of every word', () => {
  it('matches messages/en.json exactly — run scripts/prose-to-messages.ts after editing prose.md', () => {
    const onDisk = JSON.parse(readFileSync('messages/en.json', 'utf8'));
    expect(onDisk).toEqual(toMessages(lines));
  });

  it('never carries a retiring narrator line into the build', () => {
    const keys = Object.keys(toMessages(lines));
    for (const retired of ['cow_bridge', 'human_head', 'guess_body', 'run_after', 'close_6']) {
      expect(keys).not.toContain(retired);
    }
  });

  it('keeps every tag unique, before and after it becomes a key', () => {
    const tags = lines.map((line) => line.tag);
    expect(new Set(tags).size).toBe(tags.length);
    expect(new Set(tags.map(tagToKey)).size).toBe(tags.length);
  });

  it('strips provenance but keeps the words', () => {
    const blue = lines.find((line) => line.tag === 'meet.blue')!;
    expect(blue).toMatchObject({ speaker: 'blue', approved: true, text: "I'm the richest man in this world." });
    const draft = lines.find((line) => line.tag === 'invite.1')!;
    expect(draft.approved).toBe(false);
    expect(draft.text.startsWith('(draft')).toBe(false);
  });

  it('keeps a bubble\'s **shout** for the bubble, and drops the stars everywhere else', () => {
    expect(lines.find((line) => line.tag === 'dare.no')!.text).toBe('**Impossible.**');
    expect(lines.find((line) => line.tag === 'open.reel.math')!.parts).toContain('Math');
  });
});

describe('bubbles fit (brief 4.3, A2)', () => {
  const bubbles = lines.filter(isBubble);
  const said = bubbles.flatMap((line) => line.parts ?? [line.text]);

  it(`never exceed ${MAX_BUBBLE_WORDS} words in English`, () => {
    const over = said.filter((text) => wordCount(text) > MAX_BUBBLE_WORDS);
    expect(over).toEqual([]);
  });

  it(`fit two lines at bubble width in every locale (${MAX_BUBBLE_CHARS} characters)`, () => {
    const bubbleKeys = new Set(
      bubbles.flatMap((line) => (line.parts ? line.parts.map((_, i) => `${line.key}_${i + 1}`) : [line.key])),
    );
    for (const file of readdirSync('messages')) {
      const messages: Record<string, string> = JSON.parse(readFileSync(`messages/${file}`, 'utf8'));
      const tooLong = Object.entries(messages).filter(
        ([key, text]) => bubbleKeys.has(key) && text.length > MAX_BUBBLE_CHARS,
      );
      expect(tooLong, file).toEqual([]);
    }
  });
});

describe('the reel', () => {
  const math = lines.find((line) => line.tag === 'open.reel.math')!.parts!;

  it('lands on MATH, third from last, with two wrong words to overshoot onto', () => {
    expect(math[math.length - 3]).toBe('Math');
  });

  it('keeps the politically loaded words off it', () => {
    for (const loaded of ['Race', 'Genes', "God's will", 'Class']) expect(math).not.toContain(loaded);
  });
});
