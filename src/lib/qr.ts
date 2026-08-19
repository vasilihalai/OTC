/**
 * Wallet-address QR payloads are usually either a bare address or a
 * BIP21-style URI (`bitcoin:addr?amount=…`, `ethereum:addr`, `tron:addr`,
 * `litecoin:addr`, …) — strip the scheme and any query/fragment so every
 * supported chain resolves to the same plain address string.
 */
export function extractAddressFromQrText(raw: string): string {
  const text = raw.trim();
  const schemeMatch = /^[a-z][a-z0-9+.-]*:(.*)$/i.exec(text);
  const withoutScheme = schemeMatch ? schemeMatch[1] : text;
  const withoutQuery = withoutScheme.split(/[?#]/)[0];
  return withoutQuery.replace(/^\/+/, '').trim();
}
