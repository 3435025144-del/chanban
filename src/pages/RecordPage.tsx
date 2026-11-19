import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
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
const mainMeals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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
    state, dispatch, todayLog, todayTotal, todayWaterMl, todayWaterCount, todayStars, todayEarned,
    todaySteps, activeCalories, expectedDeficit, remaining, notify, showGuide, guideSeen,
  } = useApp();
  const today = todayKey();
  const location = useLocation();
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
  const photoInput = useRef<HTMLInputElement>(null);
  const timelineInput = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  useEffect(() => {
    const navState = location.state as { focus?: string } | null;
    if (navState?.focus === 'photo') photoInput.current?.click();
  }, [location.state]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = keyOf(d);
    return { key, day: d.getDate(), weekday: weekNames[i] };
  }), [weekStart]);

  const weekStats = useMemo(() => {
    const totals = weekDates.map((d) => state.logs[d.key]?.records.reduce((sum, r) => sum + r.calories, 0) ?? 0).filter((n) => n > 0);
    const perfect = weekDates.filter((d) => (state.logs[d.key]?.records.length ?? 0) >= 3).length;
    const avg = totals.length ? Math.round(totals.reduce((a, b) => a + (state.calorieGoal - b), 0) / totals.length) : 0;
    return { avg, perfect };
  }, [weekDates, state.logs, state.calorieGoal]);

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

  const waterPercent = Math.min(100, Math.round((todayWaterMl / state.waterGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((todayTotal / state.calorieGoal) * 100));

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
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: today, name: result.name, calories: Math.round(result.calories * portion),
      protein: result.protein, carbs: result.carbs, fat: result.fat, source: 'photo',
      mealType: photoMeal, time: currentTime(), amount: portion, sourceLabel: '拍照识别',
      feedback: result.feedback, honestStar: isLikelyCheat(result),
    } });
    notify('照片里的这一餐记好啦'); setPhotoPreview(null); setResult(null);
    if (!guideSeen) showGuide();
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!manualMeal || !form.name.trim() || !calories) { notify('名字和热量填一下就可以啦'); return; }
    dispatch({ type: 'ADD_RECORD', record: {
      id: uid(), date: today, name: form.name.trim(), calories, source: 'manual',
      mealType: manualMeal, time: currentTime(), amount: Math.min(10, Math.max(0.1, Number(form.amount) || 1)),
      sourceLabel: '手动记录', feedback: '亲手记下来的这一餐，分身给你比了个大拇指。', honestStar: form.honest,
    } });
    notify('记下来啦，收到一颗星');
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

  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(`记下一杯 ${state.waterCup.capacity}ml`);
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
  const openMonth = (offset: number) => {
    setMonthOffset(offset);
    setMonthOpen(true);
  };
  const chooseMonthDay = (key: string) => {
    setWeekStart(mondayOf(key));
    setSelectedDate(key);
    setMonthOpen(false);
  };
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
    <div className="space-y-4 px-4 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">记录与回看，都在这里</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-ink">今天记下来啦</h1>
        </div>
        <span className="chip shrink-0 bg-coralSoft text-xs font-medium text-coralDeep"><Icon name="star" size={13} className="mr-1 inline" />今日 +{todayStars} 星 · {todayEarned}/5</span>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => openMonth(0)} className="text-sm font-semibold text-ink underline decoration-avocado/40 underline-offset-4">{weekStart.getFullYear()}年 {weekStart.getMonth() + 1}月</button>
          <div className="flex items-center gap-1">
            <button onClick={() => openMonth(-1)} className="icon-btn h-8 w-8" aria-label="上个月"><Icon name="chevronLeft" size={16} /></button>
            <button onClick={() => { setWeekStart(mondayOf(today)); setSelectedDate(null); }} className="chip bg-warm px-2.5 py-1.5 text-[11px] text-ink">本周</button>
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
                <span className={`mb-1 text-[10px] ${isToday ? 'text-avocado' : 'text-muted'}`}>{isToday ? '今天' : date.weekday}</span>
                <button onClick={() => setSelectedDate(date.key)} className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition-colors active:scale-95 ${isToday ? 'bg-avocado text-white' : 'text-ink hover:bg-warm'}`}>{date.day}</button>
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${log?.isCheatDay ? 'bg-coral' : hasRecord ? 'bg-avocado' : 'bg-transparent'}`} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-warm px-3 py-2.5">
          <span className="muted">本周平均热量差 · 已完整记录 {weekStats.perfect} 天</span>
          <span className="text-sm font-bold text-avocado">{weekStats.avg} kcal</span>
        </div>
        {selectedDate && (
          <div className="flex items-center justify-between rounded-2xl bg-avocadoSoft px-3 py-2.5">
            <span className="text-xs text-ink/80">{formatDateCN(selectedDate)} · {selectedLog?.records.length ?? 0} 餐 · {selectedTotal} kcal</span>
            <span className="flex items-center gap-2">
              <button onClick={() => setDayDetailOpen(true)} className="text-xs font-medium text-avocado">查看</button>
              <button onClick={() => setSelectedDate(null)} className="muted">收起</button>
            </span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => photoInput.current?.click()} className="flex flex-col items-start gap-2 rounded-[20px] bg-avocadoSoft p-3 text-left shadow-card active:scale-[0.98]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="camera" size={18} /></span>
          <span><span className="block text-sm font-semibold text-ink">拍照识别</span><span className="muted">拍一下就好</span></span>
        </button>
        <button onClick={() => setManualMeal(getMealByTime())} className="flex flex-col items-start gap-2 rounded-[20px] bg-coralSoft p-3 text-left shadow-card active:scale-[0.98]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-coral"><Icon name="edit" size={18} /></span>
          <span><span className="block text-sm font-semibold text-ink">手动记一餐</span><span className="muted">自己选更准确</span></span>
        </button>
        <div className="relative flex flex-col items-start gap-2 rounded-[20px] bg-water p-3 text-left shadow-card">
          <button onClick={openCup} className="absolute right-2 top-2 text-waterInk" aria-label="水杯设置"><Icon name="settings" size={15} /></button>
          <button onClick={addWater} className="flex w-full flex-col items-start gap-2 text-left active:scale-[0.98]">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-waterInk"><Icon name="cup" size={18} /></span>
            <span><span className="block text-sm font-semibold text-ink">喝水</span><span className="muted">{todayWaterMl}/{state.waterGoal} ml</span></span>
          </button>
          {undoWaterVisible && (
            <button onClick={undoWater} className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-waterInk shadow-card active:scale-95">撤销</button>
          )}
        </div>
      </div>

      <section className="card space-y-4">
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="muted">今日摄入</p>
              <p className="mt-1 text-[26px] font-bold leading-none text-ink">{todayTotal} <span className="text-sm font-normal text-muted">/ {state.calorieGoal} kcal</span></p>
            </div>
            <span className={`text-xs ${remaining >= 0 ? 'text-avocado' : 'text-coralDeep'}`}>{remaining >= 0 ? `还差 ${remaining} kcal` : `多出 ${Math.abs(remaining)} kcal`}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-warm"><div className="h-full rounded-full bg-avocado transition-all" style={{ width: `${caloriePercent}%` }} /></div>
          <p className="muted mt-2">热量差基于基础代谢与活动量估算，仅供参考。</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-warm p-3">
            <p className="muted">活动消耗</p>
            <p className="mt-1 text-lg font-bold text-ink">{activeCalories} <span className="text-xs font-normal text-muted">kcal</span></p>
            <p className="muted">晚饭后快走 25 分钟 · {todaySteps} 步</p>
          </div>
          <div className="rounded-2xl bg-warm p-3">
            <p className="muted">预计热量差</p>
            <p className="mt-1 text-lg font-bold text-ink">{expectedDeficit} <span className="text-xs font-normal text-muted">kcal</span></p>
            <p className="muted">基础代谢 + 活动 - 摄入</p>
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今日三餐</h2>
          <span className="muted">{todayTotal} kcal</span>
        </div>
        {mainMeals.map((meal) => {
          const records = grouped[meal];
          const total = records.reduce((sum, r) => sum + r.calories, 0);
          return (
            <div key={meal} className="flex items-center gap-3 rounded-2xl bg-warm p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-lg">{mealEmoji[meal]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{mealLabels[meal]}</p>
                <p className="muted truncate">{records.length ? records.map((r) => r.name).join('、') : meal === 'snack' ? '想吃就记，不用克制' : '还没有记录'}</p>
              </div>
              {records.length > 0 ? (
                <button onClick={() => openEditor(today, records[0])} className="text-sm font-bold text-ink">{total} kcal</button>
              ) : (
                <button onClick={() => setManualMeal(meal)} className="grid h-8 w-8 place-items-center rounded-full bg-avocado text-white shadow-card" aria-label={`添加${mealLabels[meal]}`}><Icon name="plus" size={17} /></button>
              )}
            </div>
          );
        })}
        {todayLog.isCheatDay && <p className="rounded-2xl bg-coralSoft p-3 text-xs text-coralDeep">今天已标记为放纵餐，快乐也被认真收下了。</p>}
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

      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      <input ref={timelineInput} type="file" accept="image/*" onChange={handleTimeline} className="hidden" />

      <Modal open={!!manualMeal} onClose={() => setManualMeal(null)} title={manualMeal ? `添加${mealLabels[manualMeal]}` : ''}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="食物名称" className="w-full rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="份数" inputMode="decimal" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink/75"><input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />这是放纵餐，如实记录（额外 +1 星）</label>
          <button onClick={saveManual} className="btn-primary w-full">记下来啦</button>
        </div>
      </Modal>

      <Modal open={!!photoPreview} onClose={() => { setPhotoPreview(null); setResult(null); }} title="拍照识别">
        <div className="space-y-3">
          <p className="muted">演示识别，接口预留于 recognizeFood.ts。</p>
          {photoPreview && <img src={photoPreview} alt="食物预览" className="h-44 w-full rounded-2xl object-cover" />}
          <div className="flex flex-wrap gap-2">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((item) => <button key={item} onClick={() => setPhotoMeal(item)} className={`chip text-xs ${photoMeal === item ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{mealLabels[item]}</button>)}</div>
          <input value={photoAmount} onChange={(e) => setPhotoAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-warm px-4 py-2.5 text-sm text-ink outline-none" />
          {recognizing ? <p className="py-6 text-center text-sm text-muted">正在偷偷看图…</p> : result ? <div className="space-y-2 rounded-2xl bg-warm p-3"><p className="font-semibold text-ink">识别到：{result.name}</p><p className="text-xs text-ink/75">约 {result.calories} kcal</p><p className="text-xs text-avocado">{result.feedback}</p><button onClick={saveRecognized} className="btn-primary w-full">就它了，存入记录</button></div> : null}
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="修改这一餐">
        {editing && <div className="space-y-3">
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={editForm.calories} onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })} inputMode="numeric" placeholder="热量 kcal" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <input value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} inputMode="decimal" placeholder="份数" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} placeholder="时间 HH:mm" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <select value={editForm.meal} onChange={(e) => setEditForm({ ...editForm, meal: e.target.value as MealType })} className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none">{(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((meal) => <option key={meal} value={meal}>{mealLabels[meal]}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-2"><button onClick={deleteRecord} className="btn-secondary text-coral">删除</button><button onClick={saveEditor} className="btn-primary">保存修改</button></div>
        </div>}
      </Modal>

      <Modal open={monthOpen} onClose={() => setMonthOpen(false)} title={`${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`}>
        <div className="max-h-[58vh] space-y-3 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="icon-btn h-8 w-8" aria-label="上个月"><Icon name="chevronLeft" size={16} /></button>
            <span className="text-sm font-semibold text-ink">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="icon-btn h-8 w-8" aria-label="下个月"><Icon name="chevronRight" size={16} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] text-muted">{weekNames.map((name) => <span key={name}>{name}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              const key = cell.key;
              const total = key ? state.logs[key]?.records.reduce((sum, record) => sum + record.calories, 0) ?? 0 : 0;
              return key ? (
                <button key={key} onClick={() => chooseMonthDay(key)} className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-[11px] ${key === today ? 'bg-avocado text-white' : 'bg-warm text-ink'}`}>
                  <span>{cell.day}</span>
                  <span className="mt-0.5 text-[8px] opacity-75">{total ? `${total}` : ''}</span>
                </button>
              ) : <div key={`blank-${i}`} />;
            })}
          </div>
          <p className="muted text-center">点某一天回到周历，查看当天记录</p>
        </div>
      </Modal>

      <Modal open={dayDetailOpen && !!selectedDate} onClose={() => setDayDetailOpen(false)} title={selectedDate ? formatDateCN(selectedDate) : ''}>
        {selectedLog ? <div className="space-y-2">{selectedLog.records.map((record) => <button key={record.id} onClick={() => { setDayDetailOpen(false); setSelectedDate(null); openEditor(selectedDate!, record); }} className="flex w-full items-center justify-between rounded-2xl bg-warm px-3 py-2.5 text-left text-xs"><span className="truncate text-ink">{record.name}</span><span className="font-medium text-ink">{record.calories} kcal</span></button>)}</div> : <p className="text-sm text-muted">这一天还空空的，随时可以补记。</p>}
      </Modal>

      <Modal open={cupOpen} onClose={() => setCupOpen(false)} title="自定义水杯">
        <div className="space-y-3">
          <input value={cupLabel} onChange={(e) => setCupLabel(e.target.value)} placeholder="杯子名字" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" />
          <input value={cupCapacity} onChange={(e) => setCupCapacity(e.target.value)} inputMode="numeric" placeholder="容量 ml" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" />
          <div className="flex gap-2">{cupColors.map((color) => <button key={color} onClick={() => setCupColor(color)} className={`h-8 w-8 rounded-full border-2 ${cupColor === color ? 'border-ink' : 'border-transparent'}`} style={{ backgroundColor: color }} aria-label={`选择颜色 ${color}`} />)}</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{cupPresets.map((cup) => <button key={cup.id} onClick={() => { dispatch({ type: 'SET_WATER_CUP', cup }); setCupOpen(false); notify(`水杯换成${cup.label}啦`); }} className="chip shrink-0 bg-warm text-xs text-ink">{cup.label} · {cup.capacity}ml</button>)}</div>
          <button onClick={saveCup} className="btn-primary w-full">用这个杯子</button>
        </div>
      </Modal>
    </div>
  );
}
