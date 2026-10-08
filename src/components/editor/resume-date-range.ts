/**
 * "Start – End", or whichever side is set when the other is empty, so a
 * one-date entry (a certificate, a publication) never shows a dangling dash.
 */
export function dateRangeText(start: string, end: string, dash = "–"): string {
  if (start && end) return `${start} ${dash} ${end}`;
  return start || end;
}
