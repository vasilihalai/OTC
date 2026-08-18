/**
 * Splits a string into space-separated groups of 4 characters, e.g. for
 * rendering a 32-char user ID as "8f3a 92c1 7b4e 55d0 a6f2 3e81 c94b 1d07".
 */
export function formatInGroupsOf4(value: string): string {
  return value.match(/.{1,4}/g)?.join(' ') ?? value;
}
