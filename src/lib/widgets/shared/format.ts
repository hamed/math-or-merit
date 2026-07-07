export function percent(share: number, digits = 0): string {
  return `${(share * 100).toFixed(digits)}%`;
}

export function countTrades(trades: number): string {
  if (trades >= 1_000_000) {
    const millions = trades / 1_000_000;
    return `${millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)} million`;
  }
  return trades.toLocaleString('en-US');
}

/** "$1,234", "$3.20", "8¢", "0.4¢" — friendly across nine orders of magnitude. */
export function dollars(amount: number): string {
  if (amount >= 100) return `$${Math.round(amount).toLocaleString('en-US')}`;
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  if (amount >= 0.01) return `${(amount * 100).toFixed(0)}¢`;
  if (amount > 0) return `less than 1¢`;
  return '$0';
}

/** Compact axis form: "$1.2M", "$10k", "$100", "1¢" — one glance per tick. */
export function dollarsCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m >= 10 ? m.toFixed(0) : m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `$${k >= 10 ? k.toFixed(0) : k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  if (amount >= 1) return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
  if (amount >= 0.01) return `${(amount * 100).toFixed(0)}¢`;
  return '<1¢';
}
