import type { DealStatus } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

interface StatusMeta {
  listLabel: string;
  detailLabel: string;
}

// The chip text differs between the list and the detail header for
// AWAITING_FUNDS only — every other status shares one label in both places.
export const DEAL_STATUS_META: Record<DealStatus, StatusMeta> = {
  RATE_PENDING: { listLabel: ru.deals.statusRatePending, detailLabel: ru.deals.statusRatePending },
  RATE_ACTIVE: { listLabel: ru.deals.statusRateActive, detailLabel: ru.deals.statusRateActive },
  RATE_STALE: { listLabel: ru.deals.statusRateStale, detailLabel: ru.deals.statusRateStale },
  AWAITING_FUNDS: { listLabel: ru.deals.statusAwaitingFundsList, detailLabel: ru.deals.statusAwaitingFundsDetail },
  RUNNING: { listLabel: ru.deals.statusRunning, detailLabel: ru.deals.statusRunning },
  DONE: { listLabel: ru.deals.statusDone, detailLabel: ru.deals.statusDone },
  DECLINED: { listLabel: ru.deals.statusDeclined, detailLabel: ru.deals.statusDeclined },
  RATE_RENEGOTIATING: { listLabel: ru.deals.statusRenegotiating, detailLabel: ru.deals.statusRenegotiating },
};

const ACTIVE_STATUSES: DealStatus[] = ['RATE_PENDING', 'RATE_ACTIVE', 'RATE_STALE', 'AWAITING_FUNDS', 'RUNNING', 'RATE_RENEGOTIATING'];

export type DealFilter = 'ALL' | 'ACTIVE' | 'DONE' | 'DECLINED';

export function matchesFilter(status: DealStatus, filter: DealFilter): boolean {
  if (filter === 'ALL') {
    return true;
  }
  if (filter === 'ACTIVE') {
    return ACTIVE_STATUSES.includes(status);
  }
  if (filter === 'DONE') {
    return status === 'DONE';
  }
  return status === 'DECLINED';
}

export interface DocumentAvailability {
  accept: boolean;
  payment: boolean;
  certificate: boolean;
  showCaption: boolean;
}

/** §4's document-availability table. */
export function getDocumentAvailability(status: DealStatus): DocumentAvailability {
  if (status === 'DONE') {
    return { accept: true, payment: true, certificate: true, showCaption: false };
  }
  if (status === 'DECLINED') {
    return { accept: false, payment: false, certificate: false, showCaption: true };
  }
  if (status === 'RATE_PENDING' || status === 'RATE_ACTIVE' || status === 'RATE_STALE' || status === 'RATE_RENEGOTIATING') {
    return { accept: false, payment: false, certificate: false, showCaption: true };
  }
  // AWAITING_FUNDS, RUNNING
  return { accept: true, payment: true, certificate: false, showCaption: true };
}

/** Only AWAITING_FUNDS is the hold-confirmation body now — RATE_ACTIVE is its own quote-card branch. */
export function isHoldConfirmationStatus(status: DealStatus): boolean {
  return status === 'AWAITING_FUNDS';
}

/** `Детали` always shows the full row set now — every status, including the rate-in-flight ones, carries Дата создания/Направление alongside Курс. */
export function showsFullDetailsRows(_status: DealStatus): boolean {
  return true;
}

/** §7.7 — `EXECUTED`/`CANCELED`/`ERROR` (→ `DONE`/`DECLINED`) stop polling entirely; nothing about them changes server-side again. */
export function isTerminalDealStatus(status: DealStatus): boolean {
  return status === 'DONE' || status === 'DECLINED';
}
