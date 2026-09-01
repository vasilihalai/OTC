/**
 * One error shape for every backend call, regardless of which of the three
 * differently-shaped envelopes it came from (api-integration.md §1.5:
 * `auth` → `{code,message,payload[]}`, `user-account` → `BadRequestError`,
 * `financial` → `ErrorResponse`). Screens never see a raw fetch/Response —
 * they only ever catch this.
 */
export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
    public readonly requestId: string,
    public readonly raw?: unknown,
  ) {
    super(message);
  }
}

/** Best-effort parse of the three known error envelope shapes down to `{code, message}`. */
async function parseErrorBody(res: Response): Promise<{ code: string; message: string; raw?: unknown }> {
  try {
    const body = (await res.json()) as { code?: string; message?: string; error?: { code?: string; message?: string } };
    // `user-account`'s BadRequestError and `financial`'s ErrorResponse shapes
    // aren't confirmed field-for-field yet — read top-level first, fall back
    // to a nested `error` object if the flat read comes up empty.
    const code = body.code ?? body.error?.code ?? 'UNKNOWN';
    const message = body.message ?? body.error?.message ?? `Request failed with status ${res.status}`;
    return { code, message, raw: body };
  } catch {
    return { code: 'UNKNOWN', message: `Request failed with status ${res.status}` };
  }
}

export async function toApiError(res: Response, requestId: string): Promise<ApiError> {
  const { code, message, raw } = await parseErrorBody(res);
  return new ApiError(res.status, code, message, requestId, raw);
}
