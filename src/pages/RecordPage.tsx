import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Hamster from '../components/Hamster';
import Icon, { type IconName } from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { cupColors, cupPresets } from '../data/cups';
import type { FoodRecord, MealType, RecognitionResult, WaterCup } from '../types';
import { formatDateCN, monthCells, todayKey } from '../utils/date';
import { currentTime, getMealByTime, mealLabels } from '../utils/meal';
import { isLikelyCheat, recognizeFood } from '../utils/recognizeFood';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const weekNames = ['一', '二', '三', '四', '五', '六', '日'];
const mealEmoji: Record<MealType, string> = { breakfast: '🥚', lunch: '🥗', dinner: '🍛', snack: '🍊', late: '🌙', unknown: '🍽️' };
const mealTint: Record<MealType, string> = {
  breakfast: 'bg-yellowSoft', lunch: 'bg-greenSoft', dinner: 'bg-peachSoft',
  snack: 'bg-cyanSoft', late: 'bg-surface', unknown: 'bg-surface',
};
const mainMeals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'late'];

interface ActivityOption {
  id: string;
  name: string;
  meta: string;
  calories: number;
  steps?: number;
  icon: IconName;
  custom?: boolean;
}

const activityPresets: ActivityOption[] = [
  { id: 'walk', name: '散步', meta: '30 分钟 · 轻松活动', calories: 90, steps: 3000, icon: 'walk' },
  { id: 'run', name: '跑步', meta: '20 分钟 · 微微出汗', calories: 180, steps: 2600, icon: 'walk' },
  { id: 'rope', name: '跳绳', meta: '10 分钟 · 高效燃脂', calories: 120, steps: 0, icon: 'sparkle' },
  { id: 'bike', name: '骑车', meta: '30 分钟 · 户外通勤', calories: 150, steps: 0, icon: 'chart' },
  { id: 'yoga', name: '瑜伽', meta: '30 分钟 · 拉伸放松', calories: 100, steps: 0, icon: 'sparkle' },
  { id: 'chores', name: '做家务', meta: '30 分钟 · 整理房间', calories: 80, steps: 0, icon: 'home' },
];

function BottomSheet({ open, onClose, eyebrow, title, children }: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-text/40 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-sheet-up relative flex max-h-[62vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[26px] bg-card pb-[max(20px,env(safe-area-inset-bottom))] shadow-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0">
            {eyebrow && <p className="muted">{eyebrow}</p>}
            <h3 className="mt-1 text-[19px] font-bold text-text">{title}</h3>
          </div>
          <button onClick={onClose} className="icon-btn h-9 w-9 shrink-0" aria-label="关闭面板"><Icon name="close" size={18} /></button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
      </div>
    </div>
  );
}

interface EditState { date: string; record: FoodRecord }

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

export default function RecordPage() {
  const {
    state, dispatch, todayLog, todayTotal, todayWaterMl, todayWaterCount,
    activeCalories, expectedDeficit, remaining, profileComplete, notify, showGuide, guideSeen,
  } = useApp();
  const today = todayKey();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [photoMeal, setPhotoMeal] = useState<MealType>(() => getMealByTime());
  const [photoAmount, setPhotoAmount] = useState('1');
  const [manualMeal, setManualMeal] = useState<MealType | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', amount: '1', honest: false });
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editForm, setEditForm] = useState({ name: '', calories: '', amount: '1', meal: 'lunch' as MealType, time: '' });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [undoWaterVisible, setUndoWaterVisible] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [cupOpen, setCupOpen] = useState(false);
  const [cupLabel, setCupLabel] = useState(state.waterCup.label);
  const [cupCapacity, setCupCapacity] = useState(String(state.waterCup.capacity));
  const [cupColor, setCupColor] = useState(state.waterCup.color);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activityPresets[0].id);
  const [customActivities, setCustomActivities] = useState<ActivityOption[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [customCalories, setCustomCalories] = useState('');
  const [waterSheetOpen, setWaterSheetOpen] = useState(false);
  const [waterChoice, setWaterChoice] = useState(state.waterCup.id);
  const photoInput = useRef<HTMLInputElement>(null);
  const timelineInput = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = keyOf(d);
    return { key, day: d.getDate(), weekday: weekNames[i] };
  }), [weekStart]);

  const weekStats = useMemo(() => {
    const complete = weekDates.filter((d) => (state.logs[d.key]?.records.length ?? 0) > 0);
    if (!profileComplete || complete.length < 2) return { avgText: '数据不足', perfect: complete.length };
    const values = complete.map((d) => {
      const used = state.logs[d.key]?.records.reduce((sum, r) => sum + r.calories, 0) ?? 0;
      const active = state.activeCaloriesByDate[d.key] ?? 0;
      return Math.max(0, state.calorieGoal + active - used);
    });
    return { avgText: `${Math.round(values.reduce((a, b) => a + b, 0) / values.length)} kcal`, perfect: complete.length };
  }, [weekDates, state.logs, state.calorieGoal, state.activeCaloriesByDate, profileComplete]);

  const viewDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset, weekStart]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;
  const selectedTotal = selectedLog?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0;

  const grouped = useMemo(() => {
    const map = Object.fromEntries(mainMeals.map((meal) => [meal, [] as FoodRecord[]])) as Record<MealType, FoodRecord[]>;
    todayLog.records.forEach((record) => {
      const meal = inferMeal(record);
      if (map[meal]) map[meal].push(record);
      else map.snack.push(record);
    });
    return map;
  }, [todayLog.records]);

  const todayActivities = useMemo(
    () => state.activityLogs.filter((log) => log.date === today),
    [state.activityLogs, today],
  );
  const activityOptions = useMemo(
    () => [...activityPresets, ...customActivities],
    [customActivities],
  );
  const selectedActivity = activityOptions.find((item) => item.id === selectedActivityId) ?? activityPresets[0];
  const deficitText = expectedDeficit === null ? '—' : `${expectedDeficit >= 0 ? '+' : ''}${expectedDeficit}`;
  const deficitPositive = expectedDeficit !== null && expectedDeficit >= 0;
  const deficitTone = expectedDeficit === null ? 'text-textMuted' : deficitPositive ? 'text-greenText' : 'text-peachStrong';
  const waterOptions = useMemo<WaterCup[]>(() => {
    const presets = cupPresets.map((cup) => ({ ...cup }));
    if (state.waterCup.custom || state.waterCup.id === 'custom' || !presets.some((cup) => cup.id === state.waterCup.id)) {
      return [state.waterCup, ...presets];
    }
    return presets.map((cup) => cup.id === state.waterCup.id
      ? { ...cup, label: state.waterCup.label, capacity: state.waterCup.capacity, color: state.waterCup.color }
      : cup);
  }, [state.waterCup]);
  const selectedWaterCup = waterOptions.find((cup) => cup.id === waterChoice) ?? waterOptions[0];

  const caloriePercent = Math.min(100, Math.round((todayTotal / state.calorieGoal) * 100));
  const hamster = useMemo(() => {
    if (todayTotal === 0) return { head: '今天还没看到你吃了什么', body: '先拍一餐让我记下来？' };
    if (activeCalories > 0) return { head: '今天的运动已记下来', body: '活动消耗会一直累加在这里。' };
    if (remaining < 0) return { head: '今天稍微多了一点，不过不用补偿', body: '想和我一起动一动吗？' };
    if (remaining <= 300) return { head: '快到今天的参考线了', body: '下一餐可以清爽一点。' };
    if (state.streakDays >= 7) return { head: '你已经连续照顾自己七天啦', body: '记下来啦，今天又多清楚一点。' };
    return { head: '今天还稳稳的', body: '记下来啦，今天又多清楚一点。' };
  }, [todayTotal, activeCalories, remaining, state.streakDays]);

  const persistResult = (recognised: RecognitionResult, mealType: MealType, portion: number, source: FoodRecord['source'] = 'photo') => {
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: today, name: recognised.name, calories: Math.round(recognised.calories * portion),
      protein: recognised.protein, carbs: recognised.carbs, fat: recognised.fat, source,
      mealType, time: currentTime(), amount: portion, sourceLabel: '拍照识别',
      feedback: recognised.feedback, honestStar: isLikelyCheat(recognised),
    } });
    if (!guideSeen) showGuide();
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setPhotoPreview(url); setResult(null); setRecognizing(true);
      setPhotoMeal(getMealByTime()); setPhotoAmount('1');
      setResult(await recognizeFood(url)); setRecognizing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveRecognized = () => {
    if (!result) return;
    const portion = Math.min(10, Math.max(0.1, Number(photoAmount) || 1));
    persistResult(result, photoMeal, portion);
    notify('记下来啦，今天又多清楚一点。'); setPhotoPreview(null); setResult(null);
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!manualMeal || !form.name.trim() || !calories) { notify('名字和热量填一下就可以啦'); return; }
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: today, name: form.name.trim(), calories, source: 'manual',
      mealType: manualMeal, time: currentTime(), amount: Math.min(10, Math.max(0.1, Number(form.amount) || 1)),
      sourceLabel: '手动记录', feedback: '亲手记下来的这一餐，分身给你比了个大拇指。', honestStar: form.honest,
    } });
    notify('记下来啦，今天又多清楚一点。');
    setForm({ name: '', calories: '', amount: '1', honest: false }); setManualMeal(null);
    if (!guideSeen) showGuide();
  };

  const openEditor = (date: string, record: FoodRecord) => {
    setEditing({ date, record });
    setEditForm({ name: record.name, calories: String(record.calories), amount: String(record.amount ?? 1), meal: inferMeal(record), time: record.time ?? currentTime() });
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

  const openWaterSheet = () => {
    setWaterChoice(state.waterCup.id);
    setWaterSheetOpen(true);
  };
  const confirmWater = () => {
    const cup = selectedWaterCup;
    dispatch({ type: 'SET_WATER_CUP', cup });
    dispatch({ type: 'ADD_WATER', date: today, amount: cup.capacity });
    setWaterSheetOpen(false);
    notify(`记下 ${cup.capacity}ml 水`);
    setUndoWaterVisible(true);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoWaterVisible(false), 3000);
  };
  const undoWater = () => {
    if (todayWaterCount === 0) return;
    dispatch({ type: 'UNDO_WATER', date: today });
    setUndoWaterVisible(false);
    window.clearTimeout(undoTimer.current);
    notify('撤销了这一杯水');
  };
  const addCustomCalories = (amount: number) => {
    setCustomCalories(String((Number(customCalories) || 0) + amount));
  };
  const saveCustomActivity = () => {
    const name = customName.trim();
    const minutes = Math.max(0, Math.round(Number(customMinutes) || 0));
    const calories = Math.max(0, Math.round(Number(customCalories) || 0));
    if (!name) { notify('给这项运动起个名字吧'); return; }
    if (minutes < 1) { notify('运动时长至少 1 分钟'); return; }
    if (calories < 1) { notify('预估消耗至少 1 kcal'); return; }
    const option: ActivityOption = {
      id: `custom-${Date.now()}`,
      name,
      meta: `${minutes} 分钟 · 自定义运动`,
      calories,
      icon: 'sparkle',
      custom: true,
    };
    setCustomActivities((list) => [...list, option]);
    setSelectedActivityId(option.id);
    setCustomOpen(false);
    setCustomName('');
    setCustomMinutes('30');
    setCustomCalories('');
    notify(`${name}已加入，点确认打卡即可记录`);
  };
  const confirmExercise = () => {
    dispatch({
      type: 'ADD_ACTIVITY',
      date: today,
      name: selectedActivity.name,
      calories: selectedActivity.calories,
      steps: selectedActivity.steps,
    });
    setExerciseOpen(false);
    notify(`${selectedActivity.name}打卡成功，活动消耗 +${selectedActivity.calories} kcal`);
  };
  const openMonth = (offset: number) => { setMonthOffset(offset); setMonthOpen(true); };
  const chooseMonthDay = (key: string) => { setWeekStart(mondayOf(key)); setSelectedDate(key); setMonthOpen(false); };
  const openCup = () => { setCupLabel(state.waterCup.label); setCupCapacity(String(state.waterCup.capacity)); setCupColor(state.waterCup.color); setCupOpen(true); };
  const saveCup = () => {
    const capacity = Number(cupCapacity);
    if (!capacity || capacity < 50) { notify('杯子容量至少 50ml'); return; }
    const cup: WaterCup = { id: 'custom', label: cupLabel.trim() || '我的杯子', color: cupColor, icon: 'cup', capacity: Math.min(2000, capacity), custom: true };
    dispatch({ type: 'SET_WATER_CUP', cup }); setCupOpen(false); notify(`水杯换成${cup.label}啦`);
  };
  const handleTimeline = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingPhoto(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3 px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted">{formatDateCN(today)} · 记录与回看，都在这里</p>
          <h1 className="mt-1 text-[31px] font-bold leading-tight text-text">今天记下来啦</h1>
        </div>
        <Hamster size={64} mood="happy" />
      </header>

      <section className="flex items-center gap-3 rounded-[22px] bg-peachSoft p-3.5 shadow-card">
        <Hamster size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-relaxed text-text">今天还稳稳的，想看看吃什么，或者拍一餐让我记下来？</p>
          <p className="mt-1 text-[12px] leading-relaxed text-peachText">每记录一次，小馋都会回应你。</p>
          <p className="mt-1 text-[11px] leading-relaxed text-textMuted">{hamster.head} · {hamster.body}</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="muted">今日摄入</p>
            <p className="mt-1 text-[34px] font-bold leading-none text-text tabular-nums">{todayTotal} <span className="text-sm font-normal text-textMuted">/ {state.calorieGoal} kcal</span></p>
          </div>
          <span className={`ml-auto shrink-0 whitespace-nowrap text-[11px] font-medium tabular-nums ${remaining >= 0 ? 'text-primary' : 'text-warn'}`}>{remaining >= 0 ? `还可用 ${remaining} kcal` : `超出 ${Math.abs(remaining)} kcal`}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${caloriePercent}%` }} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[16px] bg-greenSoft p-3 text-center">
            <p className="text-lg font-bold text-greenText tabular-nums">{todayTotal}</p>
            <p className="mt-0.5 text-[11px] text-text/70">已摄入</p>
          </div>
          <div className="rounded-[16px] bg-cyanSoft p-3 text-center">
            <p className="text-lg font-bold text-cyanText tabular-nums">{activeCalories > 0 ? activeCalories : '—'}</p>
            <p className="mt-0.5 text-[11px] text-text/70">活动消耗</p>
          </div>
          <div className="rounded-[16px] bg-surface p-3 text-center">
            <p className={`text-lg font-bold tabular-nums ${deficitTone}`}>{deficitText}</p>
            <p className="mt-0.5 text-[11px] text-text/70">预计热量差</p>
          </div>
        </div>
        {expectedDeficit === null ? (
          <p className="text-[11px] text-textMuted">补充基础代谢数据后，这里会自动计算热量差。</p>
        ) : deficitPositive ? (
          <p className="text-[11px] text-textMuted">今天有缺口哦，继续保持！</p>
        ) : (
          <p className="text-[11px] text-textMuted">今天吃得很开心，明天继续加油！</p>
        )}
      </section>

      <button onClick={() => photoInput.current?.click()} className="relative min-h-[124px] w-full overflow-hidden rounded-[26px] bg-primaryDeep p-4 text-left shadow-card">
        <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10" />
        <span className="relative flex items-center gap-3.5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-card/15 text-primaryText"><Icon name="camera" size={26} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[19px] font-bold text-primaryText">拍照识别卡路里</span>
            <span className="mt-1 block text-[12px] leading-relaxed text-primaryText/85">拍一下，小馋帮你识别食物和热量</span>
          </span>
        </span>
        <span className="relative mt-3 block text-[11px] font-medium text-primaryText/70">对准食物拍一张，识别后可再调整份数</span>
      </button>

      <button onClick={() => navigate('/eat')} className="relative min-h-[124px] w-full overflow-hidden rounded-[26px] border border-[#F3EBD8] bg-[#FFFDF5] p-4 text-left shadow-card">
        <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#FFF3D6]" />
        <span className="relative flex items-center gap-3.5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-card text-3xl shadow-card">🍽️</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[20px] font-black leading-tight text-[#20241F]">今天不知道吃什么？</span>
            <span className="mt-1 block text-[12px] leading-relaxed text-[#5B5B57]">小馋按预算、口味和时间，帮你挑一餐</span>
          </span>
        </span>
        <span className="relative mt-3 flex justify-end">
          <span className="rounded-full bg-primaryDeep px-5 py-2.5 text-[13px] font-bold text-primaryText shadow-card">帮我选一餐 →</span>
        </span>
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setManualMeal(getMealByTime())} className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-yellowSoft p-2 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-yellowText"><Icon name="edit" size={18} /></span>
          <span className="text-[12px] font-bold text-text">手动记录</span>
          <span className="text-[10px] text-text/70">自己选更准确</span>
        </button>
        <div className="relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-cyanSoft p-2 shadow-card">
          <button onClick={openCup} className="absolute right-1 top-1 grid h-7 w-7 place-items-center text-cyanText" aria-label="水杯设置"><Icon name="settings" size={14} /></button>
          <button onClick={openWaterSheet} className="flex flex-col items-center gap-1.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-cyanText"><Icon name="cup" size={18} /></span>
            <span className="text-[12px] font-bold text-text">喝水</span>
            <span className="text-[10px] text-text/70 tabular-nums">{todayWaterMl}/{state.waterGoal} ml</span>
          </button>
          {undoWaterVisible && <button onClick={undoWater} className="absolute bottom-1 right-1 rounded-full bg-card px-2 py-0.5 text-[10px] text-primary shadow-card">撤销</button>}
        </div>
        <button onClick={() => setExerciseOpen(true)} className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-greenSoft p-2 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-greenText"><Icon name="walk" size={18} /></span>
          <span className="text-[12px] font-bold text-text">运动打卡</span>
          <span className="text-[10px] text-text/70 tabular-nums">{activeCalories > 0 ? `已消耗 ${activeCalories} kcal` : '今天还没运动'}</span>
        </button>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">本周记录</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => openMonth(-1)} className="icon-btn h-8 w-8" aria-label="上个月"><Icon name="chevronLeft" size={16} /></button>
            <button onClick={() => { setWeekStart(mondayOf(today)); setSelectedDate(null); }} className="chip bg-surface px-2.5 py-1.5 text-[11px] text-text">本周</button>
            <button onClick={() => openMonth(1)} className="icon-btn h-8 w-8" aria-label="下个月"><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date) => {
            const isToday = date.key === today;
            const log = state.logs[date.key];
            const hasRecord = !!log?.records.length;
            return (
              <div key={date.key} className="flex flex-col items-center">
                <span className={`mb-1 text-[10px] ${isToday ? 'text-primary' : 'text-textMuted'}`}>{isToday ? '今天' : date.weekday}</span>
                <button onClick={() => setSelectedDate(date.key)} className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors ${isToday ? 'bg-primary text-primaryText' : 'bg-surface text-text'}`}>{date.day}</button>
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${log?.isCheatDay ? 'bg-dotWarm' : hasRecord ? 'bg-dotGreen' : 'bg-transparent'}`} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
          <span className="muted">本周平均热量差 · 完整记录 {weekStats.perfect} 天</span>
          <span className="text-sm font-bold text-text tabular-nums">{weekStats.avgText}</span>
        </div>
        {selectedDate && (
          <div className="flex items-center justify-between rounded-2xl bg-greenSoft px-3 py-2.5">
            <span className="text-xs text-text/80 tabular-nums">{formatDateCN(selectedDate)} · {selectedLog?.records.length ?? 0} 餐 · {selectedTotal} kcal</span>
            <span className="flex items-center gap-2">
              <button onClick={() => setDayDetailOpen(true)} className="text-xs font-medium text-primary">查看</button>
              <button onClick={() => setSelectedDate(null)} className="muted">收起</button>
            </span>
          </div>
        )}
      </section>

      <section className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今天的餐食</h2>
          <span className="muted tabular-nums">已记录 {todayLog.records.length} / {mainMeals.length}</span>
        </div>
        {mainMeals.map((meal, index) => {
          const records = grouped[meal];
          const total = records.reduce((sum, r) => sum + r.calories, 0);
          return (
            <div key={meal} className={`flex items-center gap-3 py-2.5 ${index > 0 ? 'border-t border-border' : ''}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${mealTint[meal]}`}>{mealEmoji[meal]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{mealLabels[meal]}</p>
                <p className="muted truncate tabular-nums">{records.length ? records.map((r) => r.name).join('、') : meal === 'late' ? '想吃就记，不用克制' : '还没有记录'}</p>
              </div>
              {records.length > 0 ? (
                <button onClick={() => openEditor(today, records[0])} className="text-sm font-bold text-text tabular-nums">{total} kcal</button>
              ) : (
                <button onClick={() => setManualMeal(meal)} className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primaryText shadow-card" aria-label={`添加${mealLabels[meal]}`}><Icon name="plus" size={18} /></button>
              )}
            </div>
          );
        })}
        {todayLog.isCheatDay && <p className="rounded-2xl bg-peachSoft p-3 text-xs text-peachText">今天已标记为放纵餐，快乐也被认真收下了。</p>}
        {remaining < 0 && !todayLog.isCheatDay && <button onClick={() => { dispatch({ type: 'MARK_CHEAT', date: today }); notify('放纵餐已标记，诚实记录值得一颗星'); }} className="btn-secondary w-full text-xs">标记为放纵餐 · +1 星</button>}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">照片小记</h2>
          <span className="muted">只留给自己看</span>
        </div>
        <button onClick={() => timelineInput.current?.click()} className="btn-secondary w-full text-xs">添加一张照片</button>
        {state.photoTimeline.length > 0 && <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{state.photoTimeline.map((photo, i) => <img key={`${photo.date}-${i}`} src={photo.imageDataUrl} alt={formatDateCN(photo.date, false)} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />)}</div>}
        {pendingPhoto && <div className="space-y-2"><img src={pendingPhoto} alt="待保存" className="h-36 w-full rounded-2xl object-cover" /><button onClick={() => { dispatch({ type: 'ADD_PHOTO', photo: { date: today, imageDataUrl: pendingPhoto } }); setPendingPhoto(null); notify('照片收好啦'); }} className="btn-primary w-full text-xs">保存照片</button></div>}
      </section>

      <BottomSheet open={exerciseOpen} onClose={() => setExerciseOpen(false)} eyebrow="运动打卡" title="今天想动一动吗？">
        <div className="space-y-3 pb-2">
          <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
            <span className="text-xs text-text/75">今日已打卡 {todayActivities.length} 次</span>
            <span className="text-xs font-bold text-cyanText tabular-nums">已消耗 {activeCalories} kcal</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activityOptions.map((item) => {
              const active = selectedActivityId === item.id;
              return (
                <button key={item.id} onClick={() => setSelectedActivityId(item.id)} className={`relative flex flex-col items-start gap-1.5 rounded-[18px] border p-3 text-left shadow-card ${active ? 'border-primary bg-greenSoft ring-2 ring-primary' : item.custom ? 'border-primary/40 bg-card' : 'border-transparent bg-surface'}`}>
                  <span className="flex w-full items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-greenText"><Icon name={item.icon} size={18} /></span>
                    {active && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primaryText"><Icon name="check" size={12} strokeWidth={2.5} /></span>}
                  </span>
                  <span className="w-full truncate text-[13px] font-bold text-text">{item.name}</span>
                  <span className="w-full truncate text-[10px] text-textMuted">{item.meta}</span>
                  <span className="text-[12px] font-semibold text-primary tabular-nums">约 {item.calories} kcal</span>
                </button>
              );
            })}
            <button onClick={() => setCustomOpen(true)} className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-primary/60 bg-surface/60 p-3 text-center shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-primary"><Icon name="plus" size={18} /></span>
              <span className="text-[12px] font-bold text-text">自定义其他运动</span>
              <span className="text-[10px] text-textMuted">输入名称和消耗</span>
            </button>
          </div>
          <button onClick={confirmExercise} className="btn-primary w-full">确认打卡 · +{selectedActivity.calories} kcal</button>
          <p className="muted text-center text-[11px]">热量为估算值，今日首次打卡还奖励一颗星</p>
        </div>
      </BottomSheet>

      <BottomSheet open={waterSheetOpen} onClose={() => setWaterSheetOpen(false)} eyebrow="喝水" title="这杯喝多少？">
        <div className="space-y-3 pb-2">
          <p className="muted">选一个杯量，小馋会按这个容量记下来。</p>
          <div className="grid grid-cols-2 gap-2">
            {waterOptions.map((cup) => {
              const active = selectedWaterCup.id === cup.id;
              return (
                <button key={cup.id} onClick={() => setWaterChoice(cup.id)} className={`flex items-center gap-3 rounded-[18px] p-3 text-left shadow-card ${active ? 'bg-cyanSoft ring-2 ring-cyanText' : 'bg-surface'}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card" style={{ color: cup.color }}><Icon name="cup" size={19} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-text">{cup.label}</span>
                    <span className="block text-[11px] text-textMuted tabular-nums">{cup.capacity} ml</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={() => { setWaterSheetOpen(false); openCup(); }} className="btn-secondary w-full text-xs">自定义杯子容量与颜色</button>
          <button onClick={confirmWater} className="btn-primary w-full">记下 {selectedWaterCup.capacity} ml</button>
        </div>
      </BottomSheet>

      <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="自定义运动" z="z-[90]">
        <div className="space-y-3">
          <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="运动名称，如游泳" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} inputMode="numeric" placeholder="时长（分钟）" className="rounded-2xl bg-surface px-3 py-3 text-sm text-text outline-none" />
            <input value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} inputMode="numeric" placeholder="消耗（kcal）" className="rounded-2xl bg-surface px-3 py-3 text-sm text-text outline-none" />
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="muted">不知道填多少？跑步每 30 分钟约消耗 180 kcal。</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[50, 100, 150, 200].map((amount) => (
                <button key={amount} onClick={() => addCustomCalories(amount)} className="chip bg-card text-xs text-primary">+{amount}</button>
              ))}
              <button onClick={() => setCustomCalories('')} className="chip bg-card text-xs text-textMuted">清空</button>
            </div>
          </div>
          <button onClick={saveCustomActivity} className="btn-primary w-full">加入运动列表</button>
        </div>
      </Modal>

      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      <input ref={timelineInput} type="file" accept="image/*" onChange={handleTimeline} className="hidden" />

      <Modal open={!!manualMeal} onClose={() => setManualMeal(null)} title={manualMeal ? `添加${mealLabels[manualMeal]}` : ''}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="食物名称" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="份数" inputMode="decimal" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          </div>
          <label className="flex items-center gap-2 text-xs text-text/75"><input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />这是放纵餐，如实记录（额外 +1 星）</label>
          <button onClick={saveManual} className="btn-primary w-full">记下来啦</button>
        </div>
      </Modal>

      <Modal open={!!photoPreview} onClose={() => { setPhotoPreview(null); setResult(null); }} title="拍照识别">
        <div className="space-y-3">
          <p className="muted">演示识别，接口预留于 recognizeFood.ts。</p>
          {photoPreview && <img src={photoPreview} alt="食物预览" className="h-44 w-full rounded-2xl object-cover" />}
          <div className="flex flex-wrap gap-2">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((item) => <button key={item} onClick={() => setPhotoMeal(item)} className={`chip text-xs ${photoMeal === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{mealLabels[item]}</button>)}</div>
          <input value={photoAmount} onChange={(e) => setPhotoAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-text outline-none" />
          {recognizing ? <p className="py-6 text-center text-sm text-textMuted">小馋正在偷偷看图…</p> : result ? <div className="space-y-2 rounded-2xl bg-surface p-3"><p className="font-semibold text-text">识别到：{result.name}</p><p className="text-xs text-text/75 tabular-nums">约 {result.calories} kcal</p><p className="text-xs text-primary">{result.feedback}</p><button onClick={saveRecognized} className="btn-primary w-full">就它了，存入记录</button></div> : null}
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

      <Modal open={monthOpen} onClose={() => setMonthOpen(false)} title={`${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`}>
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
              const total = key ? state.logs[key]?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0 : 0;
              return key ? (
                <button key={key} onClick={() => chooseMonthDay(key)} className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-[11px] tabular-nums ${key === today ? 'bg-primary text-primaryText' : 'bg-surface text-text'}`}>
                  <span>{cell.day}</span><span className="mt-0.5 text-[8px] opacity-75">{total ? `${total}` : ''}</span>
                </button>
              ) : <div key={`blank-${i}`} />;
            })}
          </div>
          <p className="muted text-center">点某一天回到周历，查看当天记录</p>
        </div>
      </Modal>

      <Modal open={dayDetailOpen && !!selectedDate} onClose={() => setDayDetailOpen(false)} title={selectedDate ? formatDateCN(selectedDate) : ''}>
        {selectedLog ? <div className="space-y-2">{selectedLog.records.map((record) => <button key={record.id} onClick={() => { setDayDetailOpen(false); setSelectedDate(null); openEditor(selectedDate!, record); }} className="flex w-full items-center justify-between rounded-2xl bg-surface px-3 py-2.5 text-left text-xs"><span className="truncate text-text">{record.name}</span><span className="font-medium text-text tabular-nums">{record.calories} kcal</span></button>)}</div> : <p className="text-sm text-textMuted">这一天还空空的，随时可以补记。</p>}
      </Modal>

      <Modal open={cupOpen} onClose={() => setCupOpen(false)} title="自定义水杯">
        <div className="space-y-3">
          <input value={cupLabel} onChange={(e) => setCupLabel(e.target.value)} placeholder="杯子名字" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <input value={cupCapacity} onChange={(e) => setCupCapacity(e.target.value)} inputMode="numeric" placeholder="容量 ml" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <div className="flex gap-2">{cupColors.map((color) => <button key={color} onClick={() => setCupColor(color)} className={`h-8 w-8 rounded-full border-2 ${cupColor === color ? 'border-primary' : 'border-transparent'}`} style={{ backgroundColor: color }} aria-label={`选择颜色 ${color}`} />)}</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{cupPresets.map((cup) => <button key={cup.id} onClick={() => { dispatch({ type: 'SET_WATER_CUP', cup }); setCupOpen(false); notify(`水杯换成${cup.label}啦`); }} className="chip shrink-0 bg-surface text-xs text-text">{cup.label} · {cup.capacity}ml</button>)}</div>
          <button onClick={saveCup} className="btn-primary w-full">用这个杯子</button>
        </div>
      </Modal>
    </div>
  );
}
