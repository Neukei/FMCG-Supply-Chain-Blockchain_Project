import { ProductStatus } from '../types';

/** Format a unix timestamp to a readable date string */
export function formatDate(ts: number | undefined | null, opts?: { time?: boolean }): string {
  if (!ts || ts === 0) return '—';
  const d = new Date(ts * 1000);
  if (opts?.time) return d.toLocaleString('en-GB', { hour12: false });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Shorten an Ethereum address */
export function shortAddr(addr: string | undefined | null, len = 6): string {
  if (!addr) return '—';
  return `${addr.slice(0, len)}...${addr.slice(-4)}`;
}

/** Get Etherscan URL for a tx or address */
export function explorerUrl(hashOrAddr: string, chainId?: number | null): string {
  const base = chainId === 11155111
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io';
  if (hashOrAddr.length === 66) return `${base}/tx/${hashOrAddr}`;
  return `${base}/address/${hashOrAddr}`;
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

/** Get the CSS class for a status badge */
export function statusClass(status: string | undefined | null): string {
  const s = (status || 'registered').toLowerCase().replace(' ', '_');
  return `badge badge-${s}`;
}

/** Human-readable status label */
export function statusLabel(status: string | undefined | null): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

/** Days until expiry */
export function daysUntilExpiry(expiryTs: number): { days: number; isExpired: boolean; isNearExpiry: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const days = Math.ceil((expiryTs - now) / 86400);
  return { days, isExpired: days < 0, isNearExpiry: days >= 0 && days <= 30 };
}

/** Format quantity with unit */
export function formatQty(qty: number | undefined): string {
  if (!qty) return '—';
  return qty.toLocaleString();
}

/** Chain name from chainId */
export function chainName(chainId: number | null | undefined): string {
  if (chainId === 11155111) return 'Sepolia Testnet';
  if (chainId === 31337)    return 'Hardhat Local';
  if (chainId === 1)        return 'Ethereum Mainnet';
  return chainId ? `Chain ${chainId}` : 'Not Connected';
}

/** All valid next statuses for a given current status */
export const validNextStatuses: Record<ProductStatus, ProductStatus[]> = {
  REGISTERED:  ['IN_TRANSIT', 'QUARANTINED', 'RECALLED', 'DAMAGED'],
  IN_TRANSIT:  ['RECEIVED', 'DAMAGED', 'QUARANTINED', 'RECALLED'],
  RECEIVED:    ['IN_STOCK', 'QUARANTINED', 'RECALLED', 'DAMAGED'],
  IN_STOCK:    ['IN_TRANSIT', 'SOLD', 'DELIVERED', 'QUARANTINED', 'RECALLED', 'EXPIRED', 'DAMAGED'],
  QUARANTINED: ['RECALLED', 'IN_STOCK', 'DAMAGED'],
  SOLD:        ['DELIVERED'],
  DELIVERED:   [],
  RECALLED:    [],
  DAMAGED:     [],
  EXPIRED:     [],
};
