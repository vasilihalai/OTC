import type { DealStatus } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

export type StatusTone = 'success' | 'info' | 'amber' | 'danger' | 'violet' | 'neutral';

interface StatusMeta {
  tone: StatusTone;
  listLabel: string;
  detailLabel: string;
}

// The chip text differs between the list and the detail header for
// AWAITING_FUNDS only — every other status shares one label in both places.
export const DEAL_STATUS_META: Record<DealStatus, StatusMeta> = {
  RATE_PENDING: { tone: 'info', listLabel: ru.deals.statusRatePending, detailLabel: ru.deals.statusRatePending },
  RATE_ACTIVE: { tone: 'violet', listLabel: ru.deals.statusRateActive, detailLabel: ru.deals.statusRateActive },
  RATE_STALE: { tone: 'neutral', listLabel: ru.deals.statusRateStale, detailLabel: ru.deals.statusRateStale },
  AWAITING_FUNDS: {
    tone: 'amber',
    listLabel: ru.deals.statusAwaitingFundsList,
    detailLabel: ru.deals.statusAwaitingFundsDetail,
  },
  RUNNING: { tone: 'info', listLabel: ru.deals.statusRunning, detailLabel: ru.deals.statusRunning },
  DONE: { tone: 'success', listLabel: ru.deals.statusDone, detailLabel: ru.deals.statusDone },
  DECLINED: { tone: 'danger', listLabel: ru.deals.statusDeclined, detailLabel: ru.deals.statusDeclined },
};

const ACTIVE_STATUSES: DealStatus[] = ['RATE_PENDING', 'RATE_ACTIVE', 'RATE_STALE', 'AWAITING_FUNDS', 'RUNNING'];

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
    return { accept: false, payment: false, certificate: false, showCaption: false };
  }
  if (status === 'RATE_PENDING' || status === 'RATE_STALE') {
    return { accept: false, payment: false, certificate: false, showCaption: true };
  }
  return { accept: true, payment: true, certificate: false, showCaption: true };
}

export function isConfirmationStatus(status: DealStatus): boolean {
  return status === 'RATE_ACTIVE' || status === 'AWAITING_FUNDS';
}
