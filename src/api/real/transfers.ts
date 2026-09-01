import type { TransferRequest } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';
import { resolveTransferAccounts } from '@/api/real/balances.ts';

/** `POST /operations/transfer/internal` — §6. Empty 200, no OTP step. */
export async function transfer(request: TransferRequest): Promise<void> {
  const accounts = await resolveTransferAccounts();
  await apiFetch<void>('/v2/operations/transfer/internal', {
    method: 'POST',
    body: JSON.stringify({
      currency: request.ticker,
      accountFrom: accounts[request.from],
      accountTo: accounts[request.to],
      amount: Number(request.amount),
    }),
  }, false, 'financial');
}
