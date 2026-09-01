/**
 * Thrown by an `onSubmit` callback passed into `VerificationModal` when the
 * code was rejected specifically because of too many attempts, as opposed
 * to just being wrong — the modal shows a longer lockout state for this one
 * case. Generic (not tied to mock or real error shapes) so any caller can
 * signal it the same way.
 */
export class RateLimitedError extends Error {
  readonly rateLimited = true as const;
}
