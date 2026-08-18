import type { Profile } from '@/api/types.ts';
import { MOCK_PROFILE, mockDelay } from '@/api/mock/fixtures.ts';

export class MockProfileError extends Error {
  constructor() {
    super('PROFILE_FETCH_FAILED');
  }
}

// Testing hook: append ?mock_error=profile to the URL to force getProfile() to reject.
function isForcedFailure(): boolean {
  return new URLSearchParams(window.location.search).get('mock_error') === 'profile';
}

export async function getProfile(): Promise<Profile> {
  await mockDelay();
  if (isForcedFailure()) {
    throw new MockProfileError();
  }
  return MOCK_PROFILE;
}
