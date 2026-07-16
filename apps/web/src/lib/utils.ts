import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate an on-chain address for display: 0x1234…5678 */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '—';
  if (address.length <= chars * 2 + 2) return address;
  const prefix = address.startsWith('0x') ? 2 : 0;
  return `${address.slice(0, chars + prefix)}…${address.slice(-chars)}`;
}

/** Format a bounty/price amount with its token symbol. */
export function formatAmount(amount: string | number | null | undefined, token = 'ETH'): string {
  if (amount === null || amount === undefined) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return `${amount} ${token}`;
  // Trim trailing zeros but keep up to 6 decimals.
  const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return `${formatted} ${token}`;
}

/** Human relative time, e.g. "3m ago", "in 2h". */
export function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;

  const units: [number, string][] = [
    [1000 * 60 * 60 * 24, 'd'],
    [1000 * 60 * 60, 'h'],
    [1000 * 60, 'm'],
    [1000, 's'],
  ];

  for (const [ms, label] of units) {
    if (abs >= ms) {
      const value = Math.round(abs / ms);
      return future ? `in ${value}${label}` : `${value}${label} ago`;
    }
  }
  return 'just now';
}

/** Countdown string mm:ss from seconds remaining. */
export function formatCountdown(secondsRemaining: number): string {
  const s = Math.max(0, Math.floor(secondsRemaining));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
