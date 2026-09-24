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

  it('strips provenance and markdown but keeps the words', () => {
    const blue = lines.find((line) => line.tag === 'intro.blue')!;
    expect(blue).toMatchObject({ speaker: 'blue', approved: true, text: "I'm Blue. The richest man in this world." });
    const draft = lines.find((line) => line.tag === 'intro.world')!;
    expect(draft.approved).toBe(false);
    expect(draft.text.startsWith('(draft')).toBe(false);
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

describe('the reels', () => {
  const reel = (tag: string) => lines.find((line) => line.tag === tag)!.parts!;

  it('land on their word, third from last, with two wrong words to overshoot onto', () => {
    const merit = reel('open.reel.merit');
    const math = reel('open.reel.math');
    expect(merit[merit.length - 3]).toBe('Merit');
    expect(math[math.length - 3]).toBe('Math');
  });

  it('never share a serious word — the two sides ask different questions', () => {
    const merit = reel('open.reel.merit').slice(2, -3);
    const math = reel('open.reel.math').slice(2, -3);
    expect(merit.filter((word) => math.includes(word))).toEqual([]);
  });

  it('keep the politically loaded words off both sides', () => {
    const all = [...reel('open.reel.merit'), ...reel('open.reel.math')];
    for (const loaded of ['Race', 'Genes', "God's will", 'Class']) expect(all).not.toContain(loaded);
  });
});
