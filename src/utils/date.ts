export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function shiftDate(key: string, offsetDays: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + offsetDays);
  return dateKey(d);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export function formatDateCN(key: string, withWeek = true): string {
  const d = new Date(`${key}T00:00:00`);
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日${withWeek ? ` · 周${week}` : ''}`;
}

export interface MonthCell {
  key: string | null;
  day: number;
}

export function monthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: MonthCell[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push({ key: null, day: 0 });
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ key: dateKey(new Date(year, month, d)), day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: 0 });
  return cells;
}
