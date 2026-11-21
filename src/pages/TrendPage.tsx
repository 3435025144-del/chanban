import { useMemo, useState } from 'react';
import Hamster from '../components/Hamster';
import Modal from '../components/Modal';
import StarBadge from '../components/StarBadge';
import { useApp } from '../context/AppContext';
import { dateKey, shiftDate } from '../utils/date';

type Period = 'week' | 'month';

interface BarDay { label: string; value: number; kind: 'gap' | 'over' }

const weekBars: BarDay[] = [
  { label: '一', value: 320, kind: 'gap' },
  { label: '二', value: 480, kind: 'gap' },
  { label: '三', value: 260, kind: 'gap' },
  { label: '四', value: 540, kind: 'gap' },
  { label: '五', value: 180, kind: 'gap' },
  { label: '六', value: 210, kind: 'over' },
  { label: '日', value: 140, kind: 'gap' },
];
const monthBars: BarDay[] = [
  { label: '1', value: 300, kind: 'gap' }, { label: '5', value: 420, kind: 'gap' },
  { label: '9', value: 260, kind: 'over' }, { label: '13', value: 500, kind: 'gap' },
  { label: '17', value: 380, kind: 'gap' }, { label: '21', value: 190, kind: 'over' },
  { label: '25', value: 340, kind: 'gap' }, { label: '30', value: 280, kind: 'gap' },
];

export default function TrendPage() {
  const { state, dispatch } = useApp();
  const appState = state;
  const [period, setPeriod] = useState<Period>('week');
  const bars = period === 'week' ? weekBars : monthBars;

  const stats = useMemo(() => {
    const logs = Object.values(state.logs);
    const totalMeals = logs.reduce((sum, log) => sum + log.records.length, 0);
    const loggedDays = logs.filter((log) => log.records.length > 0).length;
    return {
      totalMeals: totalMeals || 15,
      loggedDays: loggedDays || 5,
      cheatDays: logs.filter((log) => log.isCheatDay).length,
    };
  }, [state.logs]);

  const steady = stats.loggedDays >= 4;
  const summaryText = steady
    ? `这周你记录得很稳，认真吃了 ${stats.totalMeals} 顿饭，小馋为你骄傲！`
    : '虽然漏记了几天，但没关系，记录本身就是爱自己～';
  const avgIntake = 1240;
  const activeBurn = 980;
  const maxBar = Math.max(...bars.map((bar) => bar.value));

  const today = dateKey();
  const weightDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const key = shiftDate(today, i - 6);
      const date = new Date(`${key}T00:00:00`);
      return { key, weekday: '日一二三四五六'[date.getDay()], day: date.getDate() };
    }),
    [today],
  );
  const mockWeights: Record<string, number> = {
    [weightDays[2].key]: 59.0,
    [weightDays[4].key]: 58.8,
    [weightDays[6].key]: 58.5,
  };
  const allWeights = { ...mockWeights, ...appState.weightRecords };
  const recordedWeights = weightDays.filter((d) => allWeights[d.key] !== undefined);
  const hasWeight = recordedWeights.length > 0;
  const [selectedWeightDate, setSelectedWeightDate] = useState(
    recordedWeights.length ? recordedWeights[recordedWeights.length - 1].key : today,
  );
  const currentWeight = allWeights[selectedWeightDate];
  const [weightInputOpen, setWeightInputOpen] = useState(false);
  const [weightDraft, setWeightDraft] = useState('');
  const heightCm = appState.height && appState.height > 0 ? appState.height : 160;
  const [heightDraft, setHeightDraft] = useState(String(heightCm));
  const heightM = heightCm / 100;
  const bmiNumber = currentWeight ? currentWeight / (heightM * heightM) : null;
  const bmi = bmiNumber !== null ? bmiNumber.toFixed(1) : '--';
  const bmiTier: 'thin' | 'normal' | 'over' = bmiNumber === null ? 'normal' : bmiNumber < 18.5 ? 'thin' : bmiNumber >= 24 ? 'over' : 'normal';
  const gaugeColors = bmiTier === 'thin'
    ? { from: '#CFE8F5', to: '#6FA8C7' }
    : bmiTier === 'over'
      ? { from: '#FBE0D2', to: '#F0936B' }
      : { from: '#CDEFD4', to: '#48A860' };
  const gaugePercent = currentWeight ? Math.max(6, Math.min(100, ((bmiNumber ?? 22) / 30) * 100)) : 0;

  const weekStart = weightDays[0].key;
  const lastWeekStart = shiftDate(weekStart, -7);
  const weekValues = recordedWeights.map((d) => allWeights[d.key]);
  const lastWeekValues = Object.entries(allWeights)
    .filter(([date]) => date >= lastWeekStart && date < weekStart)
    .map(([, value]) => value);
  const weekAvg = weekValues.length ? weekValues.reduce((a, b) => a + b, 0) / weekValues.length : null;
  const lastWeekAvg = lastWeekValues.length ? lastWeekValues.reduce((a, b) => a + b, 0) / lastWeekValues.length : null;
  const diff = weekAvg !== null && lastWeekAvg !== null ? weekAvg - lastWeekAvg : null;

  const openWeightInput = () => {
    setWeightDraft(currentWeight ? currentWeight.toFixed(1) : '');
    setHeightDraft(String(heightCm));
    setWeightInputOpen(true);
  };
  const saveWeight = () => {
    const value = Number(weightDraft);
    if (!value || value < 20 || value > 300) return;
    const height = Number(heightDraft);
    if (height >= 100 && height <= 230) dispatch({ type: 'SET_HEIGHT', height });
    dispatch({ type: 'SET_WEIGHT', date: selectedWeightDate, weight: value });
    setWeightInputOpen(false);
  };

  return (
    <div className="tp-page min-h-screen space-y-4 px-4 pb-32 pt-5">
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[12px] text-[#8E8E93]">看清自己的节奏</p>
          <h1 className="mt-1 text-[28px] font-black leading-9 text-[#1A1A1A]">趋势</h1>
        </div>
        <StarBadge />
      </header>

      <div className="tp-segment">
        {(['week', 'month'] as Period[]).map((key) => (
          <button key={key} onClick={() => setPeriod(key)} className={`tp-segment-btn ${period === key ? 'tp-segment-active' : ''}`}>
            {key === 'week' ? '本周' : '本月'}
          </button>
        ))}
      </div>

      <section className="tp-summary">
        <div className="flex items-center gap-3">
          <Hamster size={52} mood="cheer" className="ring-4 ring-white/70" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-extrabold text-[#7a4a4a]">小馋的周总结</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#8a5a5a]">{summaryText}</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <p className="text-[12px] leading-5 text-[#7a5a5a]">
            💡 小馋建议：这周晚餐平均 20:39，偏晚了一点，下周要不要试着提前半小时？
          </p>
        </div>
      </section>

      <section className="tp-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#1A1A1A]">每日热量差</h2>
          <span className="text-[11px] text-[#8E8E93]">单位 kcal</span>
        </div>
        <div className="tp-bar-chart mt-4">
          {bars.map((bar, index) => (
            <div key={index} className="tp-bar-col">
              <span className="tp-bar-value tabular-nums">{bar.value}</span>
              <div className="tp-bar-track">
                <div
                  className={`tp-bar ${bar.kind === 'gap' ? 'tp-bar-gap' : 'tp-bar-over'}`}
                  style={{ height: `${Math.max(10, (bar.value / maxBar) * 100)}%` }}
                />
              </div>
              <span className="tp-bar-label">{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="tp-legend mt-3">
          <span><i className="tp-legend-dot tp-legend-gap" />有缺口</span>
          <span><i className="tp-legend-dot tp-legend-over" />吃开心了</span>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <div className="tp-stat tp-stat-blue">
          <p className="tp-stat-value tabular-nums">{avgIntake}</p>
          <p className="tp-stat-unit">kcal</p>
          <p className="tp-stat-label">平均摄入</p>
        </div>
        <div className="tp-stat tp-stat-purple">
          <p className="tp-stat-value tabular-nums">{activeBurn}</p>
          <p className="tp-stat-unit">kcal</p>
          <p className="tp-stat-label">活动消耗</p>
        </div>
        <div className="tp-stat tp-stat-green">
          <p className="tp-stat-value tabular-nums">5 / 7</p>
          <p className="tp-stat-unit">天</p>
          <p className="tp-stat-label">完整记录</p>
        </div>
      </div>

      <section className="tp-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#1A1A1A]">这周的小规律</h2>
          <span className="text-[11px] text-[#8E8E93]">不是评分</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="tp-rule-row">
            <span className="tp-rule-icon tp-rule-purple">🌙</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#1A1A1A]">晚餐最规律</p>
              <p className="text-[12px] text-[#8E8E93]">有 5 天都在 20:30 前吃完了</p>
            </div>
            <span className="text-[13px] font-bold text-[#8E8E93]">5 天</span>
          </div>
          <div className="tp-rule-row">
            <span className="tp-rule-icon tp-rule-green">🥗</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#1A1A1A]">最常选择清淡口味</p>
              <p className="text-[12px] text-[#8E8E93]">这周选了 4 次低卡外卖</p>
            </div>
            <span className="text-[13px] font-bold text-[#8E8E93]">4 次</span>
          </div>
          <div className="tp-rule-row">
            <span className="tp-rule-icon tp-rule-blue">🚶‍♀️</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#1A1A1A]">周末活动偏少</p>
              <p className="text-[12px] text-[#8E8E93]">周末平均步数比工作日少了 1800 步</p>
            </div>
            <span className="text-[13px] font-bold text-[#8E8E93]">-1800</span>
          </div>
        </div>
      </section>

      <section className="tp-card p-4">
        <h2 className="text-[17px] font-bold text-[#1A1A1A]">体重记录</h2>

        <div className="tp-weight-strip mt-3">
          {weightDays.map((day) => {
            const weight = allWeights[day.key];
            const selected = day.key === selectedWeightDate;
            return (
              <button key={day.key} type="button" onClick={() => { if (selected) openWeightInput(); else setSelectedWeightDate(day.key); }} className={`tp-weight-day ${selected ? 'tp-weight-day-active' : ''}`}>
                <span className="tp-weight-day-week">{day.weekday}</span>
                <span className="tp-weight-day-num">{day.day}</span>
                <span className="tp-weight-day-val tabular-nums">{weight !== undefined ? weight.toFixed(1) : '—'}</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={openWeightInput} className="tp-weight-gauge" aria-label="点击修改体重">
          <svg viewBox="0 0 200 120" className="tp-gauge-svg">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gaugeColors.from} />
                <stop offset="100%" stopColor={gaugeColors.to} />
              </linearGradient>
            </defs>
            <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#EAF5EC" strokeWidth="16" strokeLinecap="round" />
            {currentWeight !== undefined && (
              <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${(gaugePercent / 100) * 251} 251`} />
            )}
          </svg>
          <div className="tp-gauge-center">
            <p className="tp-gauge-value tabular-nums">{currentWeight !== undefined ? currentWeight.toFixed(2) : '--'}<span className="tp-gauge-unit">kg</span></p>
            <div className="tp-gauge-sub">
              <span>BMI {bmi}</span>
              <span className="tp-gauge-divider" />
              <span className="tp-body-fat">体脂率 -- <span className="tp-body-fat-help" title="需连接体脂秤">?</span></span>
            </div>
          </div>
        </button>

        {diff !== null ? (
          <p className="mt-2 text-center text-[13px] font-semibold text-[#48A860]">
            {diff <= 0 ? `本周较上周 ${diff.toFixed(1)}kg，稳稳的很棒 🌱` : `本周较上周 +${diff.toFixed(1)}kg，慢慢来也没关系 🌱`}
          </p>
        ) : (
          <div className="tp-weight-empty mt-3">
            <span className="text-2xl">⚖️</span>
            <p className="mt-2 text-[13px] text-[#9a9a96]">记录两次体重，就能看到变化曲线啦</p>
          </div>
        )}
      </section>

      <Modal open={weightInputOpen} onClose={() => setWeightInputOpen(false)} title="记录体重">
        <div className="space-y-3">
          <p className="muted">记录这一天的体重，小馋帮你留意变化。</p>
          <div>
            <label className="mb-1 block text-[12px] text-textMuted">体重 (kg)</label>
            <input value={weightDraft} onChange={(e) => setWeightDraft(e.target.value)} inputMode="decimal" placeholder="例如 58.5" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-textMuted">身高 (cm) · 用于计算 BMI</label>
            <input value={heightDraft} onChange={(e) => setHeightDraft(e.target.value)} inputMode="numeric" placeholder="例如 160" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          </div>
          <button onClick={saveWeight} className="btn-primary w-full">记下来啦</button>
        </div>
      </Modal>
    </div>
  );
}
