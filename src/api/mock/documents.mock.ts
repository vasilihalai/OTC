import { mockDelay } from '@/api/mock/fixtures.ts';

/** §9.3 — the real backend generates the PDF server-side and returns a short-lived link. */
export async function getAccountCertificate(): Promise<{ url: string }> {
  await mockDelay();
  return { url: '/samples/account-certificate.pdf' };
}
