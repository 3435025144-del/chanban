import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Hamster from '../components/Hamster';
import Icon, { type IconName } from '../components/Icon';
import Modal from '../components/Modal';
import StarBadge from '../components/StarBadge';
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

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 10) return '早上好，今天想吃点什么？';
  if (hour >= 10 && hour < 14) return '午餐时间到，看看吃啥？';
  if (hour >= 14 && hour < 18) return '下午好，今天稳住了吗？';
  if (hour >= 18 && hour < 23) return '晚上好，晚餐记下来了吗？';
  return '这么晚了，是不是又馋啦？';
}

function estimateCalories(name: string): number {
  const rules: [RegExp, number][] = [
    [/牛腩饭|牛肉饭|盖饭|丼/, 550],
    [/番茄.*牛腩|红烧牛肉/, 520],
    [/汉堡|炸鸡|薯条/, 560],
    [/披萨|比萨/, 600],
    [/火锅|烧烤/, 700],
    [/奶茶|果茶/, 350],
    [/咖啡|美式|拿铁/, 120],
    [/米饭|白饭/, 230],
    [/面条|拉面|拌面|意面|米粉/, 420],
    [/饺子|馄饨|包子/, 300],
    [/沙拉|蔬菜|青菜/, 150],
    [/鸡胸|鸡腿|鸡蛋/, 180],
    [/鱼|虾|海鲜/, 220],
    [/豆腐|豆浆/, 140],
    [/红薯|玉米|土豆/, 140],
    [/粥|汤/, 150],
    [/苹果|香蕉|橙|水果/, 90],
    [/牛奶|酸奶/, 130],
    [/面包|吐司|蛋糕/, 240],
  ];
  const found = rules.find(([pattern]) => pattern.test(name));
  return found ? found[1] : 320;
}

export default function RecordPage() {
  const {
    state, dispatch, todayTotal, todayWaterMl, todayWaterCount,
    activeCalories, remaining, notify, showGuide, guideSeen,
  } = useApp();
  const today = todayKey();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [photoMeal, setPhotoMeal] = useState<MealType>(() => getMealByTime());
  const [photoAmount, setPhotoAmount] = useState('1');
  const [confirmName, setConfirmName] = useState('');
  const [confirmCalories, setConfirmCalories] = useState('');
  const [confirmGrams, setConfirmGrams] = useState('200');
  const [detailOpen, setDetailOpen] = useState<'intake' | 'activity' | 'deficit' | null>(null);
  const [manualMeal, setManualMeal] = useState<MealType | null>(null);
  const [manualDate, setManualDate] = useState(today);
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = keyOf(d);
    return { key, day: d.getDate(), weekday: weekNames[i] };
  }), [weekStart]);

  const weekStats = useMemo(() => {
    const recorded = weekDates.filter((d) => (state.logs[d.key]?.records.length ?? 0) > 0);
    if (recorded.length === 0) return { text: '本周还没开始，慢慢来就好', days: 0 };
    if (recorded.length < 2 || state.bmr <= 0) {
      return { text: `本周已陪伴你 ${recorded.length} 天，慢慢来`, days: recorded.length };
    }
    const values = recorded.map((d) => {
      const used = state.logs[d.key]?.records.reduce((sum, r) => sum + r.calories, 0) ?? 0;
      const active = state.activeCaloriesByDate[d.key] ?? 0;
      return state.bmr + active - used;
    });
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return { text: `本周平均热量差 ${avg >= 0 ? '+' : ''}${avg} kcal`, days: recorded.length };
  }, [weekDates, state.logs, state.bmr, state.activeCaloriesByDate]);

  const monthAnchorKey = selectedDate ?? keyOf(weekStart);
  const viewDate = useMemo(() => {
    const d = new Date(`${monthAnchorKey}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthAnchorKey, monthOffset]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;
  const selectedTotal = selectedLog?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0;

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

  const greeting = greetingForHour(now.getHours());
  const todayActivities = useMemo(
    () => state.activityLogs.filter((log) => log.date === today),
    [state.activityLogs, today],
  );
  const activeActivities = useMemo(
    () => state.activityLogs.filter((log) => log.date === activeDate),
    [state.activityLogs, activeDate],
  );
  const activeSkippedMeals = state.skippedMealsByDate[activeDate] ?? [];
  const activeActivityLogged = activeActivities.reduce((sum, log) => sum + log.calories, 0);
  const activeCaloriesForDate = state.activeCaloriesByDate[activeDate] ?? 0;
  const activeStepCalories = Math.max(0, activeCaloriesForDate - activeActivityLogged);
  const activeRemaining = state.calorieGoal - activeTotal;
  const activeDeficit = state.bmr > 0
    ? Math.round(state.bmr + activeCaloriesForDate - activeTotal)
    : null;
  const activeDeficitText = activeDeficit === null ? '—' : `${activeDeficit >= 0 ? '+' : ''}${activeDeficit}`;
  const activeDeficitPositive = activeDeficit !== null && activeDeficit >= 0;
  const activeDeficitTone = activeDeficit === null
    ? 'text-textMuted'
    : activeDeficitPositive ? 'text-greenText' : 'text-peachStrong';
  const activityOptions = useMemo(
    () => [...activityPresets, ...customActivities],
    [customActivities],
  );
  const selectedActivity = activityOptions.find((item) => item.id === selectedActivityId) ?? activityPresets[0];
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

  const activePercent = Math.min(100, Math.round((activeTotal / state.calorieGoal) * 100));
  const hamster = useMemo(() => {
    if (todayTotal === 0) return { head: '今天还没看到你吃了什么', body: '先拍一餐让我记下来？' };
    if (activeCalories > 0) return { head: '今天的运动已记下来', body: '活动消耗会一直累加在这里。' };
    if (remaining < 0) return { head: '今天稍微多了一点，不过不用补偿', body: '想和我一起动一动吗？' };
    if (remaining <= 300) return { head: '快到今天的参考线了', body: '下一餐可以清爽一点。' };
    if (state.streakDays >= 7) return { head: '你已经连续照顾自己七天啦', body: '记下来啦，今天又多清楚一点。' };
    return { head: '今天还稳稳的', body: '记下来啦，今天又多清楚一点。' };
  }, [todayTotal, activeCalories, remaining, state.streakDays]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setPhotoPreview(url); setResult(null); setRecognizing(true);
      setPhotoMeal(getMealByTime()); setPhotoAmount('1');
      const recognised = await recognizeFood(url);
      setResult(recognised);
      setConfirmName(recognised.name);
      setConfirmCalories(String(recognised.calories));
      setConfirmGrams('200');
      setRecognizing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmRecognized = () => {
    if (!result || !confirmName.trim()) { notify('给识别出的食物起个名字吧'); return; }
    const calories = Math.round(Number(confirmCalories) || 0);
    if (calories < 1) { notify('热量至少填 1 kcal'); return; }
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: today, name: confirmName.trim(), calories,
      protein: result.protein, carbs: result.carbs, fat: result.fat, source: 'photo',
      mealType: photoMeal, time: currentTime(), amount: Math.min(10, Math.max(0.1, Number(photoAmount) || 1)),
      grams: Math.max(0, Math.round(Number(confirmGrams) || 0)) || undefined,
      sourceLabel: '拍照识别', feedback: result.feedback, honestStar: isLikelyCheat(result),
    } });
    notify('记下来啦，今天又多清楚一点。');
    setPhotoPreview(null); setResult(null);
    if (!guideSeen) showGuide();
  };

  const smartEstimate = () => {
    const name = form.name.trim();
    if (!name) { notify('先写下食物名称，我再帮你估算'); return; }
    const value = estimateCalories(name);
    setForm((current) => ({ ...current, calories: String(value) }));
    notify(`按「${name}」估算约 ${value} kcal，可以再改`);
  };

  const openManual = (date: string, meal: MealType) => {
    setManualDate(date);
    setManualMeal(meal);
  };

  const skipMeal = () => {
    if (!manualMeal) return;
    dispatch({ type: 'SET_MEAL_SKIPPED', date: manualDate, meal: manualMeal, skipped: true });
    notify(`${mealLabels[manualMeal]}已记为没吃，不用勉强`);
    setManualMeal(null);
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!manualMeal || !form.name.trim() || !calories) { notify('名字和热量填一下就可以啦'); return; }
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: manualDate, name: form.name.trim(), calories, source: 'manual',
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
  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next);
    setSelectedDate(null);
    setMonthOffset(0);
  };
  const openMonthPicker = () => { setMonthOffset(0); setMonthOpen(true); };
  const chooseMonthDay = (key: string) => { setWeekStart(mondayOf(key)); setSelectedDate(key); setMonthOffset(0); setMonthOpen(false); };
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
    <div className="record-page rb-page space-y-4 px-4">
      <header className="rb-header">
        <div className="min-w-0">
          <p className="rb-date">{formatDateCN(today)}</p>
          <h1 className="rb-title">今天记下来啦</h1>
        </div>
        <StarBadge />
      </header>

      <section className="card rb-chat-card">
        <Hamster size={36} />
        <p className="rb-chat-text min-w-0 flex-1">{hamster.head} · {hamster.body}</p>
      </section>

      <section className="rb-week-card">
        <div className="rb-week-head">
          <span>本周</span>
          <button type="button" onClick={openMonthPicker} className="rb-week-month" aria-label="打开月历查看历史">
            {viewDate.getFullYear()}年{viewDate.getMonth() + 1}月
          </button>
        </div>
        <div className="rb-week-grid">
          {weekDates.map((date) => {
            const isToday = date.key === today;
            const isSelected = date.key === selectedDate;
            const log = state.logs[date.key];
            const hasRecord = !!log?.records.length;
            return (
              <div key={date.key} className="rb-week-cell">
                <span className="rb-week-name">{isToday ? '今天' : date.weekday}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => prev === date.key ? null : date.key)}
                  className={`rb-week-day ${isToday ? 'rb-week-day-active' : ''} ${isSelected && !isToday ? 'rb-week-day-selected' : ''}`}
                  aria-label={`查看${formatDateCN(date.key, false)}的记录`}
                >
                  {date.day}
                </button>
                <span className={`h-1 w-1 rounded-full ${log?.isCheatDay ? 'bg-dotCheat' : hasRecord ? 'bg-dotGreen' : 'bg-transparent'}`} />
              </div>
            );
          })}
        </div>
        <div className="rb-week-summary flex items-center justify-between gap-2">
          <span className="min-w-0 truncate tabular-nums">{weekStats.text}</span>
          <span className="rb-week-legend">
            <i className="rb-week-legend-dot bg-dotGreen" />绿点：有记录
            <span className="opacity-60">·</span>
            <i className="rb-week-legend-dot bg-dotCheat" />橘点：放纵餐
          </span>
        </div>
        {selectedDate && (
          <div className="flex items-center justify-between rounded-xl bg-yellowSoft px-3 py-1.5">
            <span className="truncate text-[11px] text-textMuted tabular-nums">{formatDateCN(selectedDate)} · {selectedLog?.records.length ?? 0} 餐 · {selectedTotal} kcal</span>
            <span className="ml-2 flex shrink-0 items-center gap-2">
              <button onClick={() => setDayDetailOpen(true)} className="text-[11px] font-bold text-text">查看</button>
              <button onClick={() => setSelectedDate(null)} className="rb-link">回到今天</button>
            </span>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="rb-eat-heading">
          <h2 className="rb-card-title">今天不知道吃什么？</h2>
          <button onClick={() => navigate('/eat')} className="rb-link">把小馋叫出来</button>
        </div>
        <button onClick={() => navigate('/eat')} className="rb-eat-card">
          <span className="rb-eat-orb" aria-hidden="true" />
          <span className="rb-eat-main">从一顿想吃的饭开始</span>
          <span className="rb-eat-sub">小馋会按预算、口味和时间，帮你选一份合适的。</span>
          <span className="rb-eat-cta">帮我选一餐 →</span>
        </button>
      </section>

      <button onClick={() => photoInput.current?.click()} className="rb-photo-card">
        <span className="rb-photo-icon"><Icon name="camera" size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="rb-photo-title block">拍照识别卡路里</span>
          <span className="rb-photo-sub block">拍一下，小馋帮你识别食物和热量 · +1星</span>
        </span>
        <Icon name="chevronRight" size={18} strokeWidth={2.2} />
      </button>

      <div className="rb-tool-grid">
        <button onClick={() => openManual(activeDate, getMealByTime())} className="rb-tool rb-tool-manual">
          <span className="rb-tool-icon"><Icon name="edit" size={14} /></span>
          <span className="rb-tool-label">手动记录</span>
          <span className="rb-tool-meta">自己选更准确</span>
        </button>
        <div className="rb-tool rb-tool-water relative">
          <button onClick={openCup} className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center text-textMuted" aria-label="水杯设置"><Icon name="settings" size={11} /></button>
          <button onClick={openWaterSheet} className="flex h-full w-full flex-col items-center justify-center gap-1">
            <span className="rb-tool-icon"><Icon name="cup" size={14} /></span>
            <span className="rb-tool-label">喝水</span>
            <span className="rb-tool-meta tabular-nums">{todayWaterMl}/{state.waterGoal} ml</span>
          </button>
          {undoWaterVisible && <button onClick={undoWater} className="absolute bottom-1 right-1 rounded-full bg-card px-1.5 py-0.5 text-[9px] text-text shadow-card">撤销</button>}
        </div>
        <button onClick={() => setExerciseOpen(true)} className="rb-tool rb-tool-exercise">
          <span className="rb-tool-icon"><Icon name="walk" size={14} /></span>
          <span className="rb-tool-label">运动打卡</span>
          <span className="rb-tool-meta">活动一下 · +1星</span>
        </button>
      </div>

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
            <p className="rb-stat-value tabular-nums">{activeTotal}</p>
            <p className="rb-stat-label">已摄入</p>
          </button>
          <button onClick={() => setDetailOpen('activity')} className="rb-stat bg-cyanSoft" aria-label="查看活动消耗明细">
            <p className="rb-stat-value tabular-nums">{activeCaloriesForDate > 0 ? activeCaloriesForDate : '—'}</p>
            <p className="rb-stat-label">活动消耗</p>
          </button>
          <button onClick={() => setDetailOpen('deficit')} className="rb-stat bg-surface" aria-label="查看预计热量差明细">
            <p className={`rb-stat-value tabular-nums ${activeDeficitTone}`}>{activeDeficitText}</p>
            <p className="rb-stat-label">预计热量差</p>
          </button>
        </div>
        {activeDeficit === null ? (
          <p className="rb-helper">补充基础代谢数据后，这里会自动计算热量差。</p>
        ) : activeDeficitPositive ? (
          <p className="rb-helper">这天有缺口哦，继续保持！</p>
        ) : (
          <p className="rb-helper">这天吃得很开心，明天继续加油！</p>
        )}
      </section>

      <section className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="rb-card-title">照片小记</h2>
          <button onClick={() => timelineInput.current?.click()} className="rb-link">添加照片</button>
        </div>
        {state.photoTimeline.length > 0 && <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{state.photoTimeline.map((photo, i) => <img key={`${photo.date}-${i}`} src={photo.imageDataUrl} alt={formatDateCN(photo.date, false)} className="h-12 w-12 shrink-0 rounded-xl object-cover" />)}</div>}
        {pendingPhoto && <div className="space-y-2"><img src={pendingPhoto} alt="待保存" className="h-28 w-full rounded-xl object-cover" /><button onClick={() => { dispatch({ type: 'ADD_PHOTO', photo: { date: today, imageDataUrl: pendingPhoto } }); setPendingPhoto(null); notify('照片收好啦'); }} className="btn-primary w-full text-xs">保存照片</button></div>}
      </section>

      <section className="card space-y-1">
        <div className="flex items-center justify-between pb-1">
          <h2 className="rb-card-title">{activeDateLabel === '今日' ? '今天的餐食' : `${activeDateLabel}的餐食`}</h2>
          <span className="text-[12px] text-textMuted tabular-nums">已记录 {activeRecords.length} / {mainMeals.length}</span>
        </div>
        {mainMeals.map((meal, index) => {
          const records = grouped[meal];
          const total = records.reduce((sum, r) => sum + r.calories, 0);
          const skipped = activeSkippedMeals.includes(meal);
          return (
            <div key={meal} className={`flex items-center gap-3 py-2 ${index > 0 ? 'border-t border-border' : ''}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${mealTint[meal]}`}>{mealEmoji[meal]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text">{mealLabels[meal]}</p>
                <p className="truncate text-[12px] text-textMuted tabular-nums">{records.length ? records.map((r) => r.name).join('、') : skipped ? '没吃' : meal === 'late' ? '饿了就吃点，没关系' : '还没有记录'}</p>
              </div>
              {records.length > 0 ? (
                <button onClick={() => openEditor(activeDate, records[0])} className="text-[14px] font-bold text-text tabular-nums">{total} kcal</button>
              ) : skipped ? (
                <button onClick={() => dispatch({ type: 'SET_MEAL_SKIPPED', date: activeDate, meal, skipped: false })} className="text-[12px] text-textMuted">没吃</button>
              ) : (
                <button onClick={() => openManual(activeDate, meal)} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primaryText shadow-card" aria-label={`添加${mealLabels[meal]}`}><Icon name="plus" size={17} /></button>
              )}
            </div>
          );
        })}
        {activeLog?.isCheatDay && <p className="rounded-xl bg-peachSoft px-3 py-2 text-[12px] text-peachText">这天已标记为放纵餐，快乐也被认真收下了。</p>}
        {activeRemaining < 0 && !activeLog?.isCheatDay && <button onClick={() => { dispatch({ type: 'MARK_CHEAT', date: activeDate }); notify('放纵餐已标记，诚实记录值得一颗星'); }} className="btn-secondary mt-1 w-full text-[12px]">标记为放纵餐 · +1 星</button>}
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
                  <span className="text-xs text-text">{log.name} · {log.time}</span>
                  <span className="text-xs font-bold text-cyanText tabular-nums">{log.calories} kcal</span>
                </div>
              )) : <p className="py-2 text-center text-xs text-textMuted">这天还没有运动打卡。</p>}
              {activeStepCalories > 0 && (
                <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
                  <span className="text-xs text-text">步数折算</span>
                  <span className="text-xs font-bold text-cyanText tabular-nums">{activeStepCalories} kcal</span>
                </div>
              )}
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

      <Modal open={!!manualMeal} onClose={() => setManualMeal(null)} title={manualMeal ? (manualDate === today ? `添加${mealLabels[manualMeal]}` : `补记${formatDateCN(manualDate, false)}${mealLabels[manualMeal]}`) : ''}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="食物名称，如番茄牛腩饭" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          <button onClick={smartEstimate} className="btn-secondary w-full text-xs">智能估算热量</button>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="份数" inputMode="decimal" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          </div>
          <p className="muted">估算只是参考，填好可以随时改。</p>
          <label className="flex items-center gap-2 text-xs text-text/75"><input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />这是放纵餐，如实记录（额外 +1 星）</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={skipMeal} className="btn-secondary text-xs">今天没吃这一餐</button>
            <button onClick={saveManual} className="btn-primary text-xs">记下来啦</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!photoPreview && !result} onClose={() => { setPhotoPreview(null); setResult(null); }} title="拍照识别">
        <div className="space-y-3">
          <p className="muted">小馋先看看这是什么，结果出来后你再确认。</p>
          {photoPreview && <img src={photoPreview} alt="食物预览" className="h-44 w-full rounded-2xl object-cover" />}
          <div className="flex flex-wrap gap-2">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((item) => <button key={item} onClick={() => setPhotoMeal(item)} className={`chip text-xs ${photoMeal === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{mealLabels[item]}</button>)}</div>
          <input value={photoAmount} onChange={(e) => setPhotoAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-text outline-none" />
          {recognizing && <p className="py-4 text-center text-sm text-textMuted">小馋正在偷偷看图…</p>}
        </div>
      </Modal>

      <BottomSheet open={!!result && !recognizing} onClose={() => { setResult(null); setPhotoPreview(null); }} eyebrow="拍照识别" title="确认与修改">
        <div className="space-y-3 pb-2">
          {photoPreview && <img src={photoPreview} alt="食物预览" className="h-24 w-full rounded-2xl object-cover" />}
          <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder="食物名称" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={confirmGrams} onChange={(e) => setConfirmGrams(e.target.value)} inputMode="numeric" placeholder="克数 g" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input value={confirmCalories} onChange={(e) => setConfirmCalories(e.target.value)} inputMode="numeric" placeholder="热量 kcal" className="rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          </div>
          <div className="flex flex-wrap gap-2">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((item) => <button key={item} onClick={() => setPhotoMeal(item)} className={`chip text-xs ${photoMeal === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{mealLabels[item]}</button>)}</div>
          <input value={photoAmount} onChange={(e) => setPhotoAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          {result && <p className="rounded-2xl bg-surface px-3 py-2 text-[11px] text-textMuted">{result.feedback}</p>}
          <button onClick={confirmRecognized} className="btn-primary w-full">确认保存</button>
          <p className="muted text-center text-[11px]">确认后才会写入记录，名称和热量都可以改。</p>
        </div>
      </BottomSheet>

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
                  <span className="flex items-center gap-0.5">
                    {dotClass && <i className={`h-1 w-1 rounded-full ${dotClass}`} />}
                    {cell.day}
                  </span>
                  <span className="mt-0.5 text-[8px] opacity-75">{total ? `${total}` : ''}</span>
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
