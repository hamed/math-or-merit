/**
 * Carry the owner's script from notes/prose.md into messages/en.json.
 *
 *   npx vite-node scripts/prose-to-messages.ts
 *
 * Run it after every edit to prose.md. `src/lib/content/prose.test.ts` fails
 * when the two disagree, so a stale message file cannot ship.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseProse, toMessages } from '../src/lib/content/prose';

const prose = readFileSync('notes/prose.md', 'utf8');
const messages = toMessages(parseProse(prose));
writeFileSync('messages/en.json', JSON.stringify(messages, null, 2) + '\n');
console.log(`messages/en.json: ${Object.keys(messages).length - 1} messages`);
