import { useMemo, useState } from 'react';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import StarBadge from '../components/StarBadge';
import { useApp } from '../context/AppContext';
import { shiftDate, todayKey } from '../utils/date';

type Period = 'week' | 'month';

interface DayMetric {
  date: string;
  label: string;
  intake: number;
  active: number;
  steps: number;
  water: number;
  deficit: number | null;
  hasRecord: boolean;
}

function parseTime(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = Math.round(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TrendPage() {
  const { state } = useApp();
  const [period, setPeriod] = useState<Period>('week');
  const today = todayKey();
  const dayCount = period === 'week' ? 7 : 30;
  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const days: DayMetric[] = useMemo(() => {
    return Array.from({ length: dayCount }, (_, index) => {
      const date = shiftDate(today, -(dayCount - 1 - index));
      const log = state.logs[date];
      const records = log?.records ?? [];
      const intake = records.reduce((sum, record) => sum + record.calories, 0);
      const active = state.activeCaloriesByDate[date] ?? 0;
      const water = state.waterLogs.filter((logItem) => logItem.date === date).reduce((sum, logItem) => sum + logItem.amount, 0);
      const hasRecord = records.length > 0;
      const deficit = hasRecord && state.bmr > 0 ? Math.round(state.bmr + active - intake) : null;
      const weekday = new Date(`${date}T00:00:00`).getDay();
      return {
        date,
        label: period === 'week' ? weekDayNames[weekday] : `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
        intake,
        active,
        steps: state.stepsByDate[date] ?? 0,
        water,
        deficit,
        hasRecord,
      };
    });
  }, [today, dayCount, state.logs, state.activeCaloriesByDate, state.waterLogs, state.stepsByDate, state.bmr, period]);

  const stats = useMemo(() => {
    const recorded = days.filter((day) => day.hasRecord);
    const deficits = recorded.map((day) => day.deficit).filter((value): value is number => value !== null);
    const avgDeficit = deficits.length ? Math.round(deficits.reduce((sum, value) => sum + value, 0) / deficits.length) : 0;
    const activeTotal = days.reduce((sum, day) => sum + day.active, 0);
    const avgIntake = recorded.length ? Math.round(recorded.reduce((sum, day) => sum + day.intake, 0) / recorded.length) : 0;
    const dinnerTimes: number[] = [];
    days.forEach((day) => {
      const records = state.logs[day.date]?.records ?? [];
      records.forEach((record) => {
        if (record.mealType === 'dinner' && record.time) {
          const minutes = parseTime(record.time);
          if (minutes !== null) dinnerTimes.push(minutes);
        }
      });
    });
    const avgDinner = dinnerTimes.length ? formatMinutes(dinnerTimes.reduce((sum, value) => sum + value, 0) / dinnerTimes.length) : '—';
    return {
      avgDeficit,
      activeTotal,
      avgIntake,
      recordedDays: recorded.length,
      avgDinner,
      dinnerCount: dinnerTimes.length,
    };
  }, [days, state.logs]);

  const buckets = useMemo(() => {
    const count = 7;
    return Array.from({ length: count }, (_, bucketIndex) => {
      const start = Math.floor((bucketIndex * dayCount) / count);
      const end = Math.max(start + 1, Math.floor(((bucketIndex + 1) * dayCount) / count));
      const slice = days.slice(start, end);
      const recorded = slice.filter((day) => day.hasRecord);
      const deficits = recorded.map((day) => day.deficit).filter((value): value is number => value !== null);
      const value = deficits.length ? Math.round(deficits.reduce((sum, v) => sum + v, 0) / deficits.length) : 0;
      return {
        label: period === 'week' ? (slice[0]?.label ?? '') : `${Number(slice[0]?.date.slice(5, 7))}日`,
        value: deficits.length ? value : null,
        recorded: recorded.length,
        isLast: bucketIndex === count - 1,
      };
    });
  }, [days, dayCount, period]);

  const chartValues = buckets.map((bucket) => bucket.value ?? 0);
  const maxAbs = Math.max(1, ...chartValues.map((value) => Math.abs(value)));
  const chartHeight = 132;
  const centerY = chartHeight / 2;
  const barWidth = 22;
  const chartWidth = buckets.length * 44;

  const weightPoints = useMemo(() => {
    return Object.entries(state.weightRecords)
      .filter(([date]) => date <= today)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, weight]) => ({ date, weight }));
  }, [state.weightRecords, today]);
  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1] : null;

  const summary = useMemo(() => {
    const tips: string[] = [];
    if (stats.recordedDays >= 5) {
      tips.push(`这周有 ${stats.recordedDays} 天记录了饮食，已经比什么都不记的时候更清楚自己的节奏了。`);
    } else if (stats.recordedDays > 0) {
      tips.push(`这周记录了 ${stats.recordedDays} 天，哪怕只多记一顿，也是在看顾自己。`);
    } else {
      tips.push('这周还没有饮食记录，从今天的一顿饭开始就好。');
    }
    const dinnerMinutes = parseTime(stats.avgDinner);
    if (dinnerMinutes !== null && dinnerMinutes >= 20 * 60 + 30) {
      tips.push(`这周晚餐平均 ${stats.avgDinner}，偏晚了一点，要不要下周试着提前半小时？`);
    }
    const lowActivity = days.filter((day) => day.hasRecord && day.active < 100).length;
    if (lowActivity >= 3) {
      tips.push(`有 ${lowActivity} 天活动量比较少，饭后和我走十分钟也算数。`);
    }
    return tips;
  }, [stats, days]);

  return (
    <div className="tp-page min-h-screen space-y-3 bg-page px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">看清自己的节奏</p>
          <h1 className="mt-1 rb-page-title">本周趋势</h1>
        </div>
        <StarBadge />
      </header>

      <div className="rb-segment">
        {(['week', 'month'] as Period[]).map((key) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`rb-segment-btn ${period === key ? 'rb-segment-active' : ''}`}>
            {key === 'week' ? '本周' : '本月'}
          </button>
        ))}
      </div>

      <section className="tp-card p-4">
        <p className="tp-avg-title">平均热量差</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="tp-deficit-icon">
            <Icon name="arrowRight" size={14} strokeWidth={2.4} className={stats.avgDeficit >= 0 ? '-rotate-90' : 'rotate-90'} />
          </span>
          <p className="tp-avg-value tabular-nums">{stats.avgDeficit} <span className="tp-avg-unit">kcal</span></p>
        </div>
        <p className="tp-avg-note mt-2">
          {stats.recordedDays >= 5 ? '比上周更稳定，5 天记录完整，小馋已经帮你找出节奏变化。' : `${period === 'week' ? '本周' : '本月'}记录了 ${stats.recordedDays} 天，慢慢来，记录本身就是在照顾自己。`}
        </p>
      </section>

      <section className="tp-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-text">每日热量差</h2>
          <span className="muted">单位 kcal</span>
        </div>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 26}`} className="mt-3 w-full" role="img" aria-label="每日热量差柱状图">
          <line x1="0" y1={centerY} x2={chartWidth} y2={centerY} stroke="var(--c-border)" strokeWidth="1" strokeDasharray="4 4" />
          {buckets.map((bucket, index) => {
            const x = index * 44 + (44 - barWidth) / 2;
            const value = bucket.value;
            const height = value === null ? 4 : Math.max(4, (Math.abs(value) / maxAbs) * (centerY - 14));
            const positive = (value ?? 0) >= 0;
            const barY = positive ? centerY - height : centerY;
            return (
              <g key={index}>
                {value !== null && (
                  <rect x={x} y={barY} width={barWidth} height={height} rx="6"
                    fill={positive ? 'rgb(var(--c-accent))' : 'rgb(var(--c-soft-pink))'} />
                )}
                {value === null && <rect x={x} y={centerY - 2} width={barWidth} height="4" rx="2" fill="rgb(var(--c-border))" />}
                <text x={x + barWidth / 2} y={centerY + (positive ? -height - 5 : height + 14)} textAnchor="middle" fontSize="9" fill="rgb(var(--c-text-muted))">
                  {value === null ? '' : value}
                </text>
                <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize="10" fill="rgb(var(--c-text-muted))">{bucket.label}</text>
              </g>
            );
          })}
        </svg>
        <p className="tp-legend mt-2 tabular-nums">
          <span className="flex items-center gap-1"><span className="tp-legend-dot tp-legend-positive" />明黄：热量差</span>
          <span className="flex items-center gap-1"><span className="tp-legend-dot tp-legend-over" />浅粉：超出</span>
          <span>{period === 'week' ? '本周' : '本月'}平均 {stats.avgDeficit} kcal</span>
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <div className="tp-soft-card p-3 text-center">
          <p className="text-lg font-bold text-text tabular-nums">{stats.avgIntake}</p>
          <p className="muted mt-0.5">平均摄入</p>
        </div>
        <div className="tp-soft-card p-3 text-center">
          <p className="text-lg font-bold text-text tabular-nums">{stats.activeTotal}</p>
          <p className="muted mt-0.5">活动消耗</p>
        </div>
        <div className="tp-soft-card tp-record-card p-3 text-center">
          <p className="text-lg font-bold text-text tabular-nums">{stats.recordedDays} / {dayCount}</p>
          <p className="muted mt-0.5">完整记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="tp-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-text">体重</p>
              <p className="muted mt-0.5 tabular-nums">{latestWeight ? `${Number(latestWeight.date.slice(5, 7))}/${Number(latestWeight.date.slice(8, 10))} 更新` : '还没有记录'}</p>
            </div>
            <span className="tp-tag flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"><Icon name="sparkle" size={12} />智能秤</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-[28px] font-bold leading-none text-text tabular-nums">
              {latestWeight ? latestWeight.weight.toFixed(2) : '—'} <span className="text-xs font-normal text-textMuted">公斤</span>
            </p>
            {weightPoints.length >= 2 && <WeightSparkline points={weightPoints} />}
          </div>
        </div>
        <div className="tp-soft-card p-3">
          <p className="muted">平均每日饮水</p>
          <p className="mt-1 text-lg font-bold text-text tabular-nums">{Math.round(days.reduce((sum, day) => sum + day.water, 0) / dayCount)} <span className="text-xs font-normal text-textMuted">ml</span></p>
          <p className="muted mt-0.5">{period === 'week' ? '本周' : '本月'}累计 {days.reduce((sum, day) => sum + day.water, 0)} ml</p>
        </div>
      </div>

      <section className="tp-card p-4">
        <h2 className="text-[15px] font-bold text-text">体重变化趋势</h2>
        {weightPoints.length >= 2 ? (
          <WeightChart points={weightPoints} />
        ) : (
          <p className="muted mt-3">记录两次以上体重，就能在这里看到变化曲线。</p>
        )}
      </section>

      <section className="tp-card p-4">
        <h2 className="text-[15px] font-bold text-text">喝水与步数</h2>
        <div className="mt-3 space-y-3">
          {days.slice(-7).map((day) => {
            const maxWater = Math.max(1, ...days.slice(-7).map((item) => item.water));
            const maxSteps = Math.max(1, ...days.slice(-7).map((item) => item.steps));
            return (
              <div key={day.date} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-[10px] text-textMuted">{day.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(day.water / maxWater) * 100}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-textMuted">{day.water}ml</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(day.steps / maxSteps) * 100}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-textMuted">{day.steps}步</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] text-textMuted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />饮水</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />步数</span>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-[24px] bg-peachSoft p-4 shadow-card">
        <Hamster size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-peachText">小馋的周总结</p>
          <div className="mt-1 space-y-1">
            {summary.map((tip, index) => (
              <p key={index} className="text-[12px] leading-relaxed text-text/80">“{tip}”</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function WeightSparkline({ points }: { points: { date: string; weight: number }[] }) {
  const width = 84;
  const height = 40;
  const padding = 4;
  const values = points.slice(-8).map((point) => point.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const coords = values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
  const area = `${padding},${height} ${line} ${width - padding},${height}`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mb-1 h-10 w-[84px] shrink-0" aria-hidden="true">
      <polygon points={area} fill="rgb(var(--c-accent) / 0.45)" />
      <polyline points={line} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="3" fill="rgb(var(--c-primary))" />
    </svg>
  );
}

function WeightChart({ points }: { points: { date: string; weight: number }[] }) {
  const width = 320;
  const height = 110;
  const padding = 14;
  const values = points.map((point) => point.weight);
  const min = Math.min(...values) - 0.6;
  const max = Math.max(...values) + 0.6;
  const range = Math.max(0.1, max - min);
  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (point.weight - min) / range) * (height - padding * 2);
    return { x, y, point };
  });
  const polyline = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label="体重变化折线图">
      <polyline points={polyline} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((coord, index) => (
        <g key={index}>
          <circle cx={coord.x} cy={coord.y} r="3.5" fill="rgb(var(--c-primary))" />
          <text x={coord.x} y={coord.y - 9} textAnchor="middle" fontSize="9" fill="rgb(var(--c-text-muted))">{coord.point.weight}</text>
        </g>
      ))}
    </svg>
  );
}
