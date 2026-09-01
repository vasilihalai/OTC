import type { Deal, DealDirection, OtcAccessResult, Stats } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';
import { ApiError } from '@/api/real/http/apiError.ts';
import { formatDealDate } from '@/lib/date.ts';
import { formatAmount } from '@/lib/money.ts';
import { type OtcRealStatus, mapOtcStatus } from '@/lib/otcStatus.ts';

/**
 * api-integration.md §7.1. Called on app boot (after profile) and again on
 * resume from background per the doc's own instruction — "a client whose
 * verification completed while the app was open should not have to restart
 * it."
 */
export async function getOtcAccess(): Promise<OtcAccessResult> {
  const res = await apiFetch<{ result: OtcAccessResult }>('/v1/otc/access', {}, false, 'financial');
  return res.result;
}

interface DashboardCounter {
  value: number;
  calculatedAt: string;
}

/**
 * §7.2 — feeds Home's two stat cards. Three counters exist server-side
 * (`activeRequests`, `turnover30Days`, `executedDeals`); the design only
 * shows two, so `executedDeals` is read and discarded per the doc's own
 * instruction. `turnover30Days`'s `value` isn't documented as a plain
 * number or an already-formatted string with its currency baked in — typed
 * loosely (`unknown`, coerced to a display string) since either reads fine
 * as `Stats.volume30d`; `volumeAsset` has no separate field in the response
 * at all, so it ships empty until the backend clarifies.
 */
export async function getStats(): Promise<Stats> {
  const res = await apiFetch<{
    result: { counters: { activeRequests: DashboardCounter; turnover30Days: { value: unknown; calculatedAt: string } } };
  }>('/v1/otc/dashboard', {}, false, 'financial');
  const { counters } = res.result;
  return {
    activeDeals: counters.activeRequests.value,
    volume30d: String(counters.turnover30Days.value),
    volumeAsset: '',
  };
}

const DIRECTION_MAP: Record<string, DealDirection> = { buy: 'BUY', sell: 'SELL', exchange: 'EXCHANGE' };

interface RawDealListItem {
  operationId: string;
  requestNumber: string;
  createdAt: string;
  rateExpiresAt: string | null;
  direction: 'buy' | 'sell' | 'exchange';
  assetFrom: string;
  assetTo: string;
  amountFrom: string;
  amountTo: string;
  rate: string | null;
  status: OtcRealStatus;
}

function mapListItem(raw: RawDealListItem): Deal {
  return {
    id: raw.operationId,
    requestNumber: raw.requestNumber,
    status: mapOtcStatus(raw.status),
    date: formatDealDate(raw.createdAt),
    direction: DIRECTION_MAP[raw.direction] ?? 'EXCHANGE',
    from: `${formatAmount(raw.amountFrom, raw.assetFrom)} ${raw.assetFrom}`,
    to: raw.amountTo ? `${formatAmount(raw.amountTo, raw.assetTo)} ${raw.assetTo}` : null,
    rate: raw.rate,
    ticker: raw.assetFrom,
    quoteExpiresAt: raw.rateExpiresAt ?? undefined,
    ratePerUnit: raw.rate ?? undefined,
  };
}

export interface OtcListFilters {
  statuses?: OtcRealStatus[];
  direction?: ('buy' | 'sell' | 'exchange')[];
}

/** `POST /otc/deals` — §7.3. `filters.statuses` omitted (not an empty array) means "Все," per the doc's explicit note. */
export async function getDeals(filters: OtcListFilters = {}, size = 20): Promise<Deal[]> {
  const res = await apiFetch<{ result: { operations: RawDealListItem[] } }>('/v1/otc/deals', {
    method: 'POST',
    body: JSON.stringify({ filters, pagination: { page: 0, size } }),
  }, false, 'financial');
  return res.result.operations.map(mapListItem);
}

interface RawDocument {
  nameKey: string;
  href: string;
  available: boolean;
  availabilityHint?: string;
}

interface RawDealDetail {
  requestNumber: string;
  direction: 'buy' | 'sell' | 'exchange';
  assetFrom: string;
  assetTo: string;
  status: OtcRealStatus;
  detailsStatus: string;
  rateExpiresAt: string | null;
  amountFrom: string;
  amountTo: string;
  rate: string | null;
  balance: string | null;
  missingAmount: string | null;
  documents: RawDocument[];
}

function mapDetail(operationId: string, raw: RawDealDetail): Deal {
  return {
    id: operationId,
    requestNumber: raw.requestNumber,
    status: mapOtcStatus(raw.status),
    date: '', // not part of the detail response (§7.4) — only the list carries createdAt; the detail header doesn't display a date today anyway.
    direction: DIRECTION_MAP[raw.direction] ?? 'EXCHANGE',
    from: `${formatAmount(raw.amountFrom, raw.assetFrom)} ${raw.assetFrom}`,
    to: raw.amountTo ? `${formatAmount(raw.amountTo, raw.assetTo)} ${raw.assetTo}` : null,
    rate: raw.rate,
    ticker: raw.assetFrom,
    quoteExpiresAt: raw.rateExpiresAt ?? undefined,
    ratePerUnit: raw.rate ?? undefined,
    balance: raw.balance ?? undefined,
    missingAmount: raw.missingAmount ?? undefined,
    documents: raw.documents,
    detailsStatus: raw.detailsStatus,
  };
}

/** `GET /otc/deals/{operationId}` — §7.4. `undefined` on a 404, matching the mock's `Deal | undefined` shape. */
export async function getDealById(operationId: string): Promise<Deal | undefined> {
  try {
    const res = await apiFetch<{ result: RawDealDetail }>(`/v1/otc/deals/${operationId}`, {}, false, 'financial');
    return mapDetail(operationId, res.result);
  } catch (err) {
    if (err instanceof ApiError && err.httpStatus === 404) {
      return undefined;
    }
    throw err;
  }
}
