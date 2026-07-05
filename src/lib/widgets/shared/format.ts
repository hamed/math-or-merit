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
