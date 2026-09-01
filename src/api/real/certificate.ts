import { apiFetchBlob } from '@/api/http.ts';

/**
 * `POST /certificates/open-wallet` — §8. Returns a file body, not a URL or a
 * link envelope (question B13 flags this as unconfirmed — adapt if the real
 * response turns out to be a redirect instead).
 */
export async function getAccountCertificate(): Promise<Blob> {
  return apiFetchBlob('/v1/certificates/open-wallet', {
    method: 'POST',
    body: JSON.stringify({ fileType: 'PDF' }),
  });
}
