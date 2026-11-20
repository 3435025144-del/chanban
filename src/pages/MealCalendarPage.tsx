import { useMemo, useState } from 'react';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { foods } from '../data/foodCatalog';
import type { FoodRecord } from '../types';
import { formatDateCN, monthCells, todayKey } from '../utils/date';

const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
const fallbackEmojis = ['🍚', '🍜', '🥗', '🍛', '🍲', '🍱'];

function foodEmoji(record: FoodRecord): string {
  const found = foods.find((item) => record.name.includes(item.name) || item.name.includes(record.name));
  return found?.emoji ?? fallbackEmojis[record.name.length % fallbackEmojis.length];
}

export default function MealCalendarPage() {
  const { state } = useApp();
  const today = todayKey();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const viewDate = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [today, monthOffset]);

  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const monthPrefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
  const monthEatenDays = Object.entries(state.logs)
    .filter(([date, log]) => date.startsWith(monthPrefix) && log.records.length > 0).length;
  const monthMeals = Object.entries(state.logs)
    .filter(([date, log]) => date.startsWith(monthPrefix))
    .reduce((sum, [, log]) => sum + log.records.length, 0);

  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;

  return (
    <div className="min-h-screen space-y-4 px-4 pb-10 pt-2">
      <SubPageHeader title="认真吃饭日历" subtitle="每一顿好好吃饭，都值得被记住" backTo="/me" />

      <section className="card space-y-1">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="icon-btn h-8 w-8" aria-label="上个月"><span className="text-lg">‹</span></button>
          <span className="text-sm font-bold text-text tabular-nums">{viewDate.getFullYear()} 年 {viewDate.getMonth() + 1} 月</span>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="icon-btn h-8 w-8" aria-label="下个月"><span className="text-lg">›</span></button>
        </div>
        <p className="muted text-center tabular-nums">这个月有 <span className="font-bold text-primary">{monthEatenDays}</span> 天认真吃饭 · 共记录 {monthMeals} 顿</p>
      </section>

      <section className="card space-y-2 p-3">
        <div className="grid grid-cols-7 text-center text-[10px] text-textMuted">
          {weekNames.map((name, i) => <span key={`${name}-${i}`}>{name}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            const key = cell.key;
            const log = key ? state.logs[key] : undefined;
            const records = log?.records ?? [];
            const isToday = key === today;
            const isSelected = key && key === selectedDate;
            return (
              <button
                key={`${key ?? 'blank'}-${index}`}
                disabled={!key || records.length === 0}
                onClick={() => key && setSelectedDate(isSelected ? null : key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs tabular-nums ${
                  isSelected ? 'bg-primary text-primaryText' :
                  isToday ? 'bg-yellowSoft text-yellowText' :
                  records.length > 0 ? 'bg-greenSoft text-text' :
                  'bg-calendarCell text-textMuted'
                } ${!key ? 'invisible' : ''} ${key && records.length > 0 ? 'cursor-pointer' : ''}`}
              >
                <span className="font-semibold">{cell.day}</span>
                {records.length > 0 && (
                  <span className="mt-0.5 flex flex-wrap items-center justify-center gap-px leading-none">
                    {records.slice(0, 3).map((record) => (
                      <span key={record.id} className="text-[13px]">{foodEmoji(record)}</span>
                    ))}
                    {records.length > 3 && <span className="text-[8px]">+{records.length - 3}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="muted text-center">点开带美食插图的日期，看看那天吃了什么</p>
      </section>

      {selectedDate && selectedLog && selectedLog.records.length > 0 && (
        <section className="card animate-detail-in space-y-2">
          <h2 className="text-[15px] font-bold text-text tabular-nums">{formatDateCN(selectedDate)}</h2>
          {selectedLog.records.map((record) => (
            <div key={record.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-lg">{foodEmoji(record)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text">{record.name}</p>
                <p className="muted tabular-nums">{record.time ?? '一顿饭'} · {record.sourceLabel ?? '已记录'}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-text tabular-nums">{record.calories} kcal</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
