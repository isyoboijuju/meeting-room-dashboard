export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const mondayOffset = (dow + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

export function getFridayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

export function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function shiftWeek(iso: string, delta: number): string {
  const date = new Date(iso + "T00:00:00");
  date.setDate(date.getDate() + delta * 7);
  return toLocalISO(date);
}

export function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  return { start: toLocalISO(start), end: toLocalISO(end) };
}
