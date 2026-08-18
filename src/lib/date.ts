/** Parses the mocked "DD.MM.YYYY HH:mm" deal date format. */
export function parseDealDate(value: string): Date {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = (timePart ?? '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function isWithinLastDays(value: string, days: number, now = new Date()): boolean {
  const date = parseDealDate(value);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export function isToday(value: string, now = new Date()): boolean {
  const date = parseDealDate(value);
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}
