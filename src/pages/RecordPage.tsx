import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../components/BottomSheet';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import JournalPreview from '../components/JournalPreview';
import Modal from '../components/Modal';
import StarBadge from '../components/StarBadge';
import { useApp } from '../context/AppContext';
import type { FoodRecord, MealType } from '../types';
import { formatDateCN, monthCells, shiftDate, todayKey } from '../utils/date';
import { currentTime, getMealByTime, mealLabels } from '../utils/meal';

const weekNames = ['一', '二', '三', '四', '五', '六', '日'];
const mealEmoji: Record<MealType, string> = { breakfast: '🥚', lunch: '🥗', dinner: '🍛', snack: '🍊', late: '🌙', unknown: '🍽️' };
const mealTint: Record<MealType, string> = {
  breakfast: 'bg-yellowSoft', lunch: 'bg-greenSoft', dinner: 'bg-peachSoft',
  snack: 'bg-cyanSoft', late: 'bg-surface', unknown: 'bg-surface',
};
const mainMeals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'late'];

interface EditState { date: string; record: FoodRecord }
interface Props { onOpenRecord: () => void }

function inferMeal(record: FoodRecord): MealType {
  if (record.mealType) return record.mealType;
  if (record.time) {
    const [hour, minute] = record.time.split(':').map(Number);
    if (!Number.isNaN(hour)) return getMealByTime(hour, minute ?? 0);
  }
  return getMealByTime();
}

function mondayOf(date: string): Date {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function keyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function compactCalories(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export default function RecordPage({ onOpenRecord }: Props) {
  const { state, dispatch, todayTotal, notify } = useApp();
  const today = todayKey();
  const yesterday = shiftDate(today, -1);
  const navigate = useNavigate();
  const isNewUser = useMemo(
    () => Object.values(state.logs).every((log) => !log.records.length),
    [state.logs],
  );
  const hour = new Date().getHours();
  const greetingTitle = isNewUser
    ? '欢迎来到馋伴'
    : hour < 11 ? '早上好，今天也要好好吃饭'
      : hour < 14 ? '中午好，记得好好吃饭'
        : hour < 18 ? '下午好，小馋在呢'
          : hour < 22 ? '晚上好，今天辛苦啦' : '夜深了，饿了就吃点，没关系';
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [detailOpen, setDetailOpen] = useState<'intake' | 'activity' | 'deficit' | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editForm, setEditForm] = useState({ name: '', calories: '', amount: '1', meal: 'lunch' as MealType, time: '' });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [quickMeal, setQuickMeal] = useState<MealType | null>(null);
  const [quickForm, setQuickForm] = useState({ name: '', calories: '' });
  const [journalPickOpen, setJournalPickOpen] = useState(false);
  const [pickedPhotoIds, setPickedPhotoIds] = useState<string[]>([]);
  const [journalOpen, setJournalOpen] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = keyOf(d);
    return { key, day: d.getDate(), weekday: weekNames[i] };
  }), [weekStart]);

  const weekStats = useMemo(() => {
    const recorded = weekDates.filter((d) => (state.logs[d.key]?.records.length ?? 0) > 0);
    return { text: `本周已记录 ${recorded.length} 天，小馋陪你慢慢来～` };
  }, [weekDates, state.logs]);

  const monthAnchorKey = selectedDate ?? keyOf(weekStart);
  const viewDate = useMemo(() => {
    const d = new Date(`${monthAnchorKey}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthAnchorKey, monthOffset]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const activeDate = selectedDate ?? today;
  const activeLog = state.logs[activeDate];
  const activeRecords = activeLog?.records ?? [];
  const activeTotal = activeRecords.reduce((sum, record) => sum + record.calories, 0);
  const activeDateLabel = activeDate === today ? '今日' : formatDateCN(activeDate, false);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(mainMeals.map((meal) => [meal, [] as FoodRecord[]])) as Record<MealType, FoodRecord[]>;
    activeRecords.forEach((record) => {
      const meal = inferMeal(record);
      if (map[meal]) map[meal].push(record);
      else map.snack.push(record);
    });
    return map;
  }, [activeRecords]);

  const activeActivities = useMemo(
    () => state.activityLogs.filter((log) => log.date === activeDate),
    [state.activityLogs, activeDate],
  );
  const activeSkippedMeals = state.skippedMealsByDate[activeDate] ?? [];
  const activeActivityLogged = activeActivities.reduce((sum, log) => sum + log.calories, 0);
  const activeCaloriesForDate = state.activeCaloriesByDate[activeDate] ?? 0;
  const activeStepCalories = Math.max(0, activeCaloriesForDate - activeActivityLogged);
  const activeRemaining = state.calorieGoal - activeTotal;
  const activeDeficit = state.bmr > 0 ? Math.round(state.bmr + activeCaloriesForDate - activeTotal) : null;
  const activeDeficitText = activeDeficit === null ? '—' : `${activeDeficit >= 0 ? '+' : ''}${activeDeficit}`;
  const activeDeficitPositive = activeDeficit !== null && activeDeficit >= 0;
  const activeDeficitTone = activeDeficit === null ? 'text-textMuted' : activeDeficitPositive ? 'text-greenText' : 'text-peachStrong';
  const activePercent = Math.min(100, Math.round((activeTotal / state.calorieGoal) * 100));
  const todayPhotos = useMemo(
    () => (state.logs[today]?.records ?? []).filter((record) => record.source === 'photo' && record.imageDataUrl),
    [state.logs, today],
  );

  const hamsterText = useMemo(() => {
    if (todayTotal === 0) return '今天还没看到你吃了什么，去拍一餐让我记下来？';
    if (todayTotal > state.calorieGoal) return '吃得很开心吧？超出一点没关系，小馋陪你散散步～';
    return '今天吃得刚刚好，热量稳稳的，继续保持哦！';
  }, [todayTotal, state.calorieGoal]);

  const openEditor = (date: string, record: FoodRecord) => {
    setEditing({ date, record });
    setEditForm({ name: record.name, calories: String(record.calories), amount: String(record.amount ?? 1), meal: inferMeal(record), time: record.time ?? '12:00' });
  };
  const saveEditor = () => {
    if (!editing) return;
    const calories = Number(editForm.calories);
    if (!editForm.name.trim() || !calories) { notify('名字和热量要填一下哦'); return; }
    dispatch({ type: 'UPDATE_RECORD', date: editing.date, record: { ...editing.record, name: editForm.name.trim(), calories, amount: Math.min(10, Math.max(0.1, Number(editForm.amount) || 1)), mealType: editForm.meal, time: editForm.time } });
    notify('这条记录改好啦'); setEditing(null);
  };
  const deleteRecord = () => {
    if (!editing) return;
    dispatch({ type: 'DELETE_RECORD', date: editing.date, recordId: editing.record.id });
    notify('这条记录已删除'); setEditing(null);
  };
  const openQuickAdd = (meal: MealType) => {
    setQuickForm({ name: '', calories: '' });
    setQuickMeal(meal);
  };
  const saveQuickAdd = () => {
    if (!quickMeal) return;
    const calories = Number(quickForm.calories);
    if (!quickForm.name.trim() || !calories || calories < 1) { notify('名字和热量填一下就可以啦'); return; }
    dispatch({ type: 'ADD_RECORD', record: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: activeDate, name: quickForm.name.trim(), calories, source: 'manual',
      mealType: quickMeal, time: currentTime(), amount: 1,
      sourceLabel: '快速添加', feedback: '随手记下的这一餐，分身给你比了个大拇指。',
    } });
    notify('记下来啦，今天又多清楚一点。');
    setQuickMeal(null);
  };
  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next); setSelectedDate(null); setMonthOffset(0);
  };
  const openMonthPicker = () => { setMonthOffset(0); setMonthOpen(true); };
  const chooseMonthDay = (key: string) => { setWeekStart(mondayOf(key)); setSelectedDate(key); setMonthOffset(0); setMonthOpen(false); };

  return (
    <div className="record-page rb-page space-y-4 px-4">
      <header className="rb-header">
        <div className="min-w-0">
          <p className="rb-date">{formatDateCN(today)}</p>
          <h1 className="rb-title">{greetingTitle}</h1>
        </div>
        <StarBadge />
      </header>

      <section className="card rb-chat-card">
        <Hamster size={36} />
        <div className="min-w-0 flex-1">
          <p className="rb-chat-text">{hamsterText}</p>
          <p className="rb-chat-tip">每记录一次，小馋都会回应你。</p>
        </div>
      </section>

      <section className="space-y-2">
        <div className="rb-eat-heading">
          <h2 className="rb-card-title">今天不知道吃什么？</h2>
          <button onClick={() => navigate('/eat')} className="rb-link">把小馋叫出来</button>
        </div>
        <button onClick={() => navigate('/eat')} className={`rb-eat-card ${isNewUser ? 'rb-eat-card-new' : ''}`}>
          <span className="rb-eat-orb" aria-hidden="true" />
          <span className="rb-eat-main">从一顿想吃的饭开始</span>
          <span className="rb-eat-sub">小馋会按预算、口味和时间，帮你选一份合适的。</span>
          <span className="rb-eat-cta">帮我选一餐 →</span>
        </button>
      </section>

      <section className="card rb-intake-card space-y-2">
        <div className="rb-intake-head">
          <div className="min-w-0">
            <p className="rb-section-label">{activeDateLabel}摄入</p>
            <p className="rb-big-number tabular-nums">{activeTotal} <span className="rb-unit">/ {state.calorieGoal} kcal</span></p>
          </div>
          <span className={`shrink-0 whitespace-nowrap text-[12px] font-medium tabular-nums ${activeRemaining >= 0 ? 'text-text' : 'text-warn'}`}>
            {activeRemaining >= 0 ? `还可用 ${activeRemaining} kcal` : `超出 ${Math.abs(activeRemaining)} kcal`}
          </span>
        </div>
        <div className="rb-progress"><div className="rb-progress-fill" style={{ width: `${activePercent}%` }} /></div>
        <div className="rb-stat-grid">
          <button onClick={() => setDetailOpen('intake')} className="rb-stat bg-greenSoft" aria-label="查看已摄入明细">
            <p className="rb-stat-value tabular-nums">{activeTotal}</p><p className="rb-stat-label">已摄入</p>
          </button>
          <button onClick={() => setDetailOpen('activity')} className="rb-stat bg-cyanSoft" aria-label="查看活动消耗明细">
            <p className="rb-stat-value tabular-nums">{activeCaloriesForDate > 0 ? activeCaloriesForDate : '—'}</p><p className="rb-stat-label">活动消耗</p>
          </button>
          <button onClick={() => setDetailOpen('deficit')} className="rb-stat rb-stat-deficit" aria-label="查看预计热量差明细">
            <p className={`rb-stat-value tabular-nums ${activeDeficitTone}`}>{activeDeficitText}</p><p className="rb-stat-label">预计热量差</p>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          {activeRecords.length === 0 ? (
            <p className="rb-helper min-w-0 flex-1 truncate">今天还没记录，去添加吧～</p>
          ) : activeDeficit === null ? (
            <p className="rb-helper min-w-0 flex-1 truncate">补充基础代谢后自动算热量差</p>
          ) : activeDeficitPositive ? (
            <p className="rb-helper min-w-0 flex-1 truncate">这天有缺口哦，继续保持！</p>
          ) : (
            <p className="rb-helper min-w-0 flex-1 truncate">这天吃得很开心，明天继续加油！</p>
          )}
          <button type="button" onClick={() => setMealSheetOpen(true)} className="rb-meal-link shrink-0">
            {activeRecords.length === 0 ? '今天还没记录，去添加' : '查看今日三餐'} <Icon name="chevronRight" size={12} />
          </button>
        </div>
      </section>

      <section className="rb-week-card">
        <div className="rb-week-head">
          <span className="rb-week-title">本周</span>
          <div className="flex items-center gap-3">
            {selectedDate && selectedDate !== today && (
              <button type="button" onClick={() => setSelectedDate(null)} className="rb-week-back">回到今天</button>
            )}
            <button type="button" onClick={openMonthPicker} className="rb-week-month" aria-label="打开月历查看历史">
              {viewDate.getFullYear()}年{viewDate.getMonth() + 1}月
            </button>
          </div>
        </div>
        <div className="rb-week-grid">
          {weekDates.map((date) => {
            const isToday = date.key === today;
            const isSelected = date.key === selectedDate;
            const log = state.logs[date.key];
            const dayTotal = log?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0;
            const hasRecord = dayTotal > 0;
            const isCheat = Boolean(log?.isCheatDay) || date.key === yesterday;
            const isActive = isSelected || (!selectedDate && isToday);
            return (
              <div key={date.key} className="rb-week-cell">
                <span className="rb-week-name">{date.weekday}</span>
                <button type="button" onClick={() => setSelectedDate((prev) => prev === date.key ? null : date.key)}
                  className={`rb-week-day ${isActive ? 'rb-week-day-active' : ''}`}
                  aria-label={`查看${formatDateCN(date.key, false)}的记录`}>{date.day}</button>
                <span className="rb-week-kcal tabular-nums">{hasRecord ? compactCalories(dayTotal) : '-'}</span>
                <span className="rb-week-dot-slot">
                  {isCheat ? <i className="rb-week-dot rb-week-dot-cheat" /> : hasRecord ? <i className="rb-week-dot rb-week-dot-record" /> : null}
                </span>
              </div>
            );
          })}
        </div>
        <div className="rb-week-summary">
          <span className="rb-week-summary-text tabular-nums">{weekStats.text}</span>
        </div>
      </section>

      <section className="card space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="rb-card-title">今日食光</h2>
            <p className="muted mt-0.5">拍过的每一口，都在这里</p>
          </div>
          <button type="button" onClick={() => { setPickedPhotoIds(todayPhotos.slice(0, 4).map((r) => r.id)); setJournalPickOpen(true); }} className="fg-journal-btn shrink-0">
            ✨ {todayPhotos.length > 0 ? `今天拍了 ${todayPhotos.length} 张 · 做手账` : '制作专属手账'}
          </button>
        </div>
        {todayPhotos.length > 0 ? (
          <div className="fg-strip">
            {todayPhotos.map((record, i) => (
              <div key={record.id} className="fg-card" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
                <img src={record.imageDataUrl} alt={record.name} className="fg-photo" />
                <span className="fg-meta tabular-nums">{record.time ?? '今天'} · {record.calories} kcal</span>
              </div>
            ))}
            <button type="button" onClick={onOpenRecord} className="fg-add-card">
              <span className="text-2xl">＋</span>
              <span className="mt-1 text-[10px]">拍一张</span>
            </button>
          </div>
        ) : (
          <button onClick={onOpenRecord} className="fg-empty-large">
            <span className="text-4xl">📷</span>
            <span className="mt-3 text-[13px] font-bold text-text">拍下今天吃的第一顿美食，留住快乐</span>
            <span className="mt-1 text-[11px] text-textMuted">点这里打开记录中心</span>
          </button>
        )}
      </section>

      <BottomSheet open={detailOpen !== null} onClose={() => setDetailOpen(null)} eyebrow={`${activeDateLabel}明细`} title={detailOpen === 'intake' ? '已摄入来源' : detailOpen === 'activity' ? '活动消耗来源' : '预计热量差怎么算'}>
        <div className="space-y-2 pb-2">
          {detailOpen === 'intake' && (
            activeRecords.length ? activeRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
                <span className="min-w-0 truncate text-xs text-text">{mealLabels[record.mealType ?? 'unknown']} · {record.name}{record.grams ? ` ${record.grams}g` : ''}</span>
                <span className="shrink-0 text-xs font-bold text-text tabular-nums">{record.calories} kcal</span>
              </div>
            )) : <p className="py-4 text-center text-xs text-textMuted">这天还没有饮食记录。</p>
          )}
          {detailOpen === 'activity' && (
            <>
              {activeActivities.length ? activeActivities.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
                  <span className="text-xs text-text">{log.name} · {log.time}</span><span className="text-xs font-bold text-cyanText tabular-nums">{log.calories} kcal</span>
                </div>
              )) : <p className="py-2 text-center text-xs text-textMuted">这天还没有运动打卡。</p>}
              {activeStepCalories > 0 && <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5"><span className="text-xs text-text">步数折算</span><span className="text-xs font-bold text-cyanText tabular-nums">{activeStepCalories} kcal</span></div>}
            </>
          )}
          {detailOpen === 'deficit' && (
            <div className="space-y-2">
              <div className="space-y-1.5 rounded-2xl bg-surface p-3 text-xs">
                <p className="flex justify-between"><span className="text-textMuted">基础代谢</span><span className="font-semibold text-text tabular-nums">{state.bmr > 0 ? `${state.bmr} kcal` : '未设置'}</span></p>
                <p className="flex justify-between"><span className="text-textMuted">活动消耗</span><span className="font-semibold text-cyanText tabular-nums">{activeCaloriesForDate} kcal</span></p>
                <p className="flex justify-between"><span className="text-textMuted">已摄入</span><span className="font-semibold text-text tabular-nums">{activeTotal} kcal</span></p>
                <p className="flex justify-between border-t border-border pt-1.5"><span className="font-medium text-text">预计热量差</span><span className={`font-bold tabular-nums ${activeDeficitTone}`}>{activeDeficitText}</span></p>
              </div>
              <p className="muted text-center text-[11px]">公式：基础代谢 + 活动消耗 - 已摄入</p>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={mealSheetOpen}
        onClose={() => setMealSheetOpen(false)}
        eyebrow={`${activeDateLabel}记录`}
        title="今日餐食详情"
        footer={
          <div className="space-y-2 pb-1">
            {activeLog?.isCheatDay && <p className="rounded-xl bg-peachSoft px-3 py-2 text-[12px] text-peachText">这天已标记为放纵餐，快乐也被认真收下了。</p>}
            {activeRemaining < 0 && !activeLog?.isCheatDay && (
              <button onClick={() => { dispatch({ type: 'MARK_CHEAT', date: activeDate }); notify('放纵餐已标记，诚实记录值得一颗星'); }} className="btn-secondary w-full text-[12px]">标记为放纵餐 · +1 星</button>
            )}
            <button type="button" onClick={() => setMealSheetOpen(false)} className="btn-primary w-full text-[13px]">完成</button>
          </div>
        }
      >
        <div className="space-y-1 pb-2">
          {mainMeals.map((meal, index) => {
            const records = grouped[meal];
            const total = records.reduce((sum, r) => sum + r.calories, 0);
            const skipped = activeSkippedMeals.includes(meal);
            return (
              <div key={meal} className={`flex items-center gap-3 py-2 ${index > 0 ? 'border-t border-border' : ''}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${mealTint[meal]}`}>{mealEmoji[meal]}</span>
                <button type="button" onClick={() => records.length && openEditor(activeDate, records[0])} className="min-w-0 flex-1 text-left">
                  <p className="text-[14px] font-bold text-text">{mealLabels[meal]}{total > 0 && <span className="ml-2 text-[12px] font-semibold text-textMuted tabular-nums">{total} kcal</span>}</p>
                  <p className="truncate text-[12px] text-textMuted tabular-nums">{records.length ? records.map((r) => r.name).join('、') : skipped ? '没吃' : meal === 'late' ? '饿了就吃点，没关系' : '还没有记录，点 + 添加'}</p>
                </button>
                <button type="button" onClick={() => openQuickAdd(meal)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-card" style={{ backgroundColor: '#5F8F6A' }} aria-label={`添加${mealLabels[meal]}`}><Icon name="plus" size={17} strokeWidth={2.5} /></button>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      <Modal
        open={!!quickMeal}
        onClose={() => setQuickMeal(null)}
        title={quickMeal ? `添加${mealLabels[quickMeal]}` : '添加餐食'}
        z="z-[90]"
        overlayClass="bg-black/50"
      >
        <div className="space-y-3">
          <p className="muted">随手记一笔，帮小馋把这一餐补上。</p>
          <input value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} placeholder="食物名称，如番茄牛腩饭" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <input value={quickForm.calories} onChange={(e) => setQuickForm({ ...quickForm, calories: e.target.value })} inputMode="numeric" placeholder="预估热量 kcal" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setQuickMeal(null)} className="btn-secondary">取消</button>
            <button onClick={saveQuickAdd} className="btn-primary">记下来啦</button>
          </div>
        </div>
      </Modal>

      <Modal open={monthOpen} onClose={() => { setMonthOpen(false); setMonthOffset(0); }} title={`${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`}>
        <div className="max-h-[58vh] space-y-3 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="icon-btn h-8 w-8" aria-label="上个月"><Icon name="chevronLeft" size={16} /></button>
            <span className="text-sm font-semibold text-text">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="icon-btn h-8 w-8" aria-label="下个月"><Icon name="chevronRight" size={16} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] text-textMuted">{weekNames.map((name) => <span key={name}>{name}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              const key = cell.key;
              const dayLog = key ? state.logs[key] : undefined;
              const total = dayLog?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0;
              const dotClass = dayLog?.isCheatDay ? 'bg-dotCheat' : dayLog?.records.length ? 'bg-dotGreen' : '';
              return key ? (
                <button key={key} onClick={() => chooseMonthDay(key)} className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-[11px] tabular-nums ${key === today ? 'bg-primary text-primaryText' : 'bg-surface text-text'}`}>
                  <span className="flex items-center gap-0.5">{dotClass && <i className={`h-1 w-1 rounded-full ${dotClass}`} />}{cell.day}</span>
                  <span className="mt-0.5 text-[8px] opacity-75">{total ? `${total}` : ''}</span>
                </button>
              ) : <div key={`blank-${i}`} />;
            })}
          </div>
          <p className="muted text-center">点某一天回到周历，查看当天记录</p>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="修改这一餐">
        {editing && <div className="space-y-3">
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={editForm.calories} onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })} inputMode="numeric" placeholder="热量 kcal" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} inputMode="decimal" placeholder="份数" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} placeholder="时间 HH:mm" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <select value={editForm.meal} onChange={(e) => setEditForm({ ...editForm, meal: e.target.value as MealType })} className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((meal) => <option key={meal} value={meal}>{mealLabels[meal]}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-2"><button onClick={deleteRecord} className="btn-secondary text-warn">删除</button><button onClick={saveEditor} className="btn-primary">保存修改</button></div>
        </div>}
      </Modal>

      <BottomSheet
        open={journalPickOpen}
        onClose={() => setJournalPickOpen(false)}
        eyebrow="手账素材"
        title="选出今天想留住的画面"
        footer={
          <button type="button" onClick={() => { setJournalPickOpen(false); setJournalOpen(true); }} disabled={pickedPhotoIds.length === 0} className="btn-primary w-full">
            下一步：生成手账{pickedPhotoIds.length > 0 ? ` · 已选 ${pickedPhotoIds.length} 张` : ''}
          </button>
        }
      >
        {todayPhotos.length === 0 ? (
          <p className="py-10 text-center text-sm text-textMuted">今天还没有照片，先拍一张再来制作手账吧。</p>
        ) : (
          <div className="space-y-3 pb-4">
            <p className="muted">最多选 4 张，点照片即可勾选或取消。</p>
            <div className="grid grid-cols-3 gap-2">
              {todayPhotos.map((record) => {
                const picked = pickedPhotoIds.includes(record.id);
                return (
                  <button key={record.id} type="button" onClick={() => setPickedPhotoIds((ids) => picked ? ids.filter((id) => id !== record.id) : ids.length >= 4 ? ids : [...ids, record.id])} className={`jpick-item ${picked ? 'jpick-item-active' : ''}`}>
                    <img src={record.imageDataUrl} alt={record.name} className="h-full w-full object-cover" />
                    {picked && <span className="jpick-check"><Icon name="check" size={12} strokeWidth={3} /></span>}
                    <span className="jpick-meta">{record.time ?? '今天'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </BottomSheet>

      <JournalPreview
        open={journalOpen}
        onClose={() => { setJournalOpen(false); setJournalPickOpen(false); }}
        photos={todayPhotos.filter((r) => pickedPhotoIds.includes(r.id)).map((r) => ({ src: r.imageDataUrl!, time: r.time, calories: r.calories, name: r.name }))}
        dateLabel={formatDateCN(today, false)}
        totalCalories={todayTotal}
        mealCount={activeRecords.length}
      />
    </div>
  );
}
