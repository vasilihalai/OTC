// openLink (Telegram SDK) requires an absolute URL — BASE_URL alone is root-relative.
// Shared by every "open a document" action in the app (deal documents, the
// profile account certificate) — they all just open this one bundled PDF.
export const SAMPLE_DOCUMENT_URL = new URL(`${import.meta.env.BASE_URL}documents/sample.pdf`, window.location.origin).toString();
