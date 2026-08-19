import type { BalanceScenario } from '@/api/index.ts';
import { MOCK_MIN_DEAL } from '@/api/mock/fixtures.ts';

export const BALANCE_SCENARIOS: BalanceScenario[] = ['sufficient', 'short1', 'short', 'belowmin'];

/** Validates a `?scenario=` search-param value, e.g. `#/deals/OTC-1055?scenario=short`. */
export function isBalanceScenario(value: string | null): value is BalanceScenario {
  return !!value && (BALANCE_SCENARIOS as string[]).includes(value);
}

export function parseAmountValue(raw: string): number {
  return Number(raw.replace(/[^\d.]/g, '')) || 0;
}

export function getMinDealAmount(ticker: string): number {
  return Number(MOCK_MIN_DEAL[ticker] ?? '0');
}

/** Deposit-account balance for the deal's source asset, synthesised so every callout branch is reachable. */
export function computeScenarioBalance(dealAmount: number, ticker: string, scenario: BalanceScenario): number {
  const min = Number(MOCK_MIN_DEAL[ticker] ?? '0');
  switch (scenario) {
    case 'sufficient':
      return dealAmount * 1.2;
    case 'short1':
      return dealAmount * 0.995;
    case 'short':
      return Math.max(dealAmount * 0.6, min * 1.1);
    case 'belowmin':
      return min * 0.5;
    default:
      return dealAmount * 1.2;
  }
}
