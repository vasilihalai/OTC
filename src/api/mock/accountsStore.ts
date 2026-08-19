import type { Accounts, TransferAccount } from '@/api/types.ts';
import { MOCK_ACCOUNTS } from '@/api/mock/fixtures.ts';

// In-memory, mutated by transfers/withdrawals so a balance change is visible
// immediately and survives navigation within the session; a reload resets
// back to the fixtures.
const accounts: Accounts = {
  deposit: { ...MOCK_ACCOUNTS.deposit },
  trading: { ...MOCK_ACCOUNTS.trading },
};

export function getAccountsSnapshot(): Accounts {
  return { deposit: { ...accounts.deposit }, trading: { ...accounts.trading } };
}

export function getAccountBalance(account: TransferAccount, ticker: string): number {
  return Number(accounts[account][ticker] ?? '0');
}

export function setAccountBalance(account: TransferAccount, ticker: string, value: number): void {
  accounts[account][ticker] = String(Math.max(0, value));
}

export function moveBetweenAccounts(from: TransferAccount, to: TransferAccount, ticker: string, amount: number): void {
  setAccountBalance(from, ticker, getAccountBalance(from, ticker) - amount);
  setAccountBalance(to, ticker, getAccountBalance(to, ticker) + amount);
}
