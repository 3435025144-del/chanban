import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { cupColors, cupPresets } from '../data/cups';
import type { FoodRecord, MealType, RecognitionResult, WaterCup } from '../types';
import { formatDateCN, monthCells, todayKey } from '../utils/date';
import { currentTime, getMealByTime, mealLabels, mealOrder } from '../utils/meal';
import { isLikelyCheat, recognizeFood } from '../utils/recognizeFood';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface EditState {
  date: string;
  record: FoodRecord;
}

function inferMeal(record: FoodRecord): MealType {
  if (record.mealType) return record.mealType;
  if (record.time) {
    const [hour, minute] = record.time.split(':').map(Number);
    if (!Number.isNaN(hour)) return getMealByTime(hour, minute ?? 0);
  }
  return getMealByTime();
}

export default function RecordPage() {
  const {
    state,
    dispatch,
    todayLog,
    todayTotal,
    todayWaterMl,
    todayWaterCount,
    todayStars,
    todaySteps,
    remaining,
    notify,
  } = useApp();
  const today = todayKey();
  const location = useLocation();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [photoMeal, setPhotoMeal] = useState<MealType>(() => getMealByTime());
  const [photoAmount, setPhotoAmount] = useState('1');
  const [manualMeal, setManualMeal] = useState<MealType | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', amount: '1', protein: '', carbs: '', fat: '', honest: false });
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editForm, setEditForm] = useState({ name: '', calories: '', amount: '1', meal: 'lunch' as MealType, time: '' });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [cupOpen, setCupOpen] = useState(false);
  const [cupLabel, setCupLabel] = useState(state.waterCup.label);
  const [cupCapacity, setCupCapacity] = useState(String(state.waterCup.capacity));
  const [cupColor, setCupColor] = useState(state.waterCup.color);
  const [healthOpen, setHealthOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const timelineInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const navState = location.state as { focus?: string } | null;
    if (navState?.focus === 'photo') photoInput.current?.click();
  }, [location.state]);

  const viewDate = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset, today]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;

  const grouped = useMemo(() => {
    const map = Object.fromEntries(mealOrder.map((meal) => [meal, [] as FoodRecord[]])) as Record<MealType, FoodRecord[]>;
    todayLog.records.forEach((record) => {
      const meal = inferMeal(record);
      map[meal].push(record);
    });
    return map;
  }, [todayLog.records]);

  const percent = Math.min(100, Math.round((todayWaterMl / state.waterGoal) * 100));

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setPhotoPreview(url);
      setResult(null);
      setRecognizing(true);
      setPhotoMeal(getMealByTime());
      setPhotoAmount('1');
      const recognized = await recognizeFood(url);
      setResult(recognized);
      setRecognizing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveRecognized = () => {
    if (!result) return;
    const portion = Math.min(10, Math.max(0.1, Number(photoAmount) || 1));
    dispatch({
      type: 'ADD_RECORD',
      record: {
        id: uid(),
        date: today,
        name: result.name,
        calories: Math.round(result.calories * portion),
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        source: 'photo',
        mealType: photoMeal,
        time: currentTime(),
        amount: portion,
        sourceLabel: '拍照识别',
        feedback: result.feedback,
        honestStar: isLikelyCheat(result),
      },
    });
    notify('照片里的这一餐记好啦');
    setPhotoPreview(null);
    setResult(null);
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!manualMeal || !form.name.trim() || !calories || calories <= 0) {
      notify('名字和热量填一下就可以啦');
      return;
    }
    dispatch({
      type: 'ADD_RECORD',
      record: {
        id: uid(),
        date: today,
        name: form.name.trim(),
        calories,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fat: form.fat ? Number(form.fat) : undefined,
        source: 'manual',
        mealType: manualMeal,
        time: currentTime(),
        amount: Math.min(10, Math.max(0.1, Number(form.amount) || 1)),
        sourceLabel: '手动记录',
        feedback: '亲手记下来的这一餐，分身给你比了个大拇指。',
        honestStar: form.honest,
      },
    });
    notify('记下来啦，收到一颗星');
    setForm({ name: '', calories: '', amount: '1', protein: '', carbs: '', fat: '', honest: false });
    setManualMeal(null);
  };

  const openEditor = (date: string, record: FoodRecord) => {
    setEditing({ date, record });
    setEditForm({
      name: record.name,
      calories: String(record.calories),
      amount: String(record.amount ?? 1),
      meal: inferMeal(record),
      time: record.time ?? currentTime(),
    });
  };

  const saveEditor = () => {
    if (!editing) return;
    const calories = Number(editForm.calories);
    if (!editForm.name.trim() || !calories || calories <= 0) {
      notify('名字和热量要填一下哦');
      return;
    }
    dispatch({
      type: 'UPDATE_RECORD',
      date: editing.date,
      record: {
        ...editing.record,
        name: editForm.name.trim(),
        calories,
        amount: Math.min(10, Math.max(0.1, Number(editForm.amount) || 1)),
        mealType: editForm.meal,
        time: editForm.time,
      },
    });
    notify('这条记录改好啦');
    setEditing(null);
  };

  const deleteRecord = () => {
    if (!editing) return;
    dispatch({ type: 'DELETE_RECORD', date: editing.date, recordId: editing.record.id });
    notify('这条记录已删除');
    setEditing(null);
  };

  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(`记下一杯 ${state.waterCup.capacity}ml`);
  };

  const undoWater = () => {
    if (todayWaterCount === 0) return;
    dispatch({ type: 'UNDO_WATER', date: today });
    notify('撤销了最近一杯水');
  };

  const openCup = () => {
    setCupLabel(state.waterCup.label);
    setCupCapacity(String(state.waterCup.capacity));
    setCupColor(state.waterCup.color);
    setCupOpen(true);
  };

  const saveCup = () => {
    const capacity = Number(cupCapacity);
    if (!capacity || capacity < 50) {
      notify('杯子容量至少 50ml');
      return;
    }
    const cup: WaterCup = {
      id: 'custom',
      label: cupLabel.trim() || '我的杯子',
      color: cupColor,
      icon: 'cup',
      capacity: Math.min(2000, capacity),
      custom: true,
    };
    dispatch({ type: 'SET_WATER_CUP', cup });
    setCupOpen(false);
    notify(`水杯换成${cup.label}啦`);
  };

  const syncWalk = () => {
    dispatch({ type: 'ADD_STEPS', date: today, steps: 600 });
    notify(state.walkStarDates.includes(today) ? '又走了一段，舒服就好' : '走完十分钟，收到一颗星');
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
    <div className="space-y-4 px-4 pb-8 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">记录不是考试，是给自己一个拥抱</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">今天也记下来啦</h1>
        </div>
        <span className="chip shrink-0 bg-avocadoSoft text-xs text-avocadoInk">今日 +{todayStars} 星</span>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => photoInput.current?.click()} className="card flex items-center gap-2 py-3 text-left active:scale-[0.98]">
          <Icon name="camera" size={19} className="text-avocadoInk" />
          <span className="text-sm font-medium text-ink">拍照识别</span>
        </button>
        <button onClick={() => setManualMeal(getMealByTime())} className="card flex items-center gap-2 py-3 text-left active:scale-[0.98]">
          <Icon name="edit" size={19} className="text-avocadoInk" />
          <span className="text-sm font-medium text-ink">手动记一餐</span>
        </button>
        <button onClick={addWater} className="card flex items-center gap-2 py-3 text-left active:scale-[0.98]">
          <Icon name="cup" size={19} className="text-avocadoInk" />
          <span className="text-sm font-medium text-ink">记一杯水</span>
        </button>
        <button onClick={syncWalk} className="card flex items-center gap-2 py-3 text-left active:scale-[0.98]">
          <Icon name="walk" size={19} className="text-avocadoInk" />
          <span className="text-sm font-medium text-ink">走十分钟</span>
        </button>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">喝水小杯</h2>
          <span className="muted">{todayWaterMl} / {state.waterGoal} ml</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-avocado transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {cupPresets.map((cup) => (
            <button
              key={cup.id}
              onClick={() => { dispatch({ type: 'SET_WATER_CUP', cup }); notify(`水杯换成${cup.label}啦`); }}
              className={`chip shrink-0 text-xs ${state.waterCup.id === cup.id ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}
            >
              {cup.label} · {cup.capacity}ml
            </button>
          ))}
          <button onClick={openCup} className={`chip shrink-0 text-xs ${state.waterCup.custom ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}>
            自定义杯子
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={addWater} className="btn-primary">记一杯 · {state.waterCup.capacity}ml</button>
          <button onClick={undoWater} disabled={todayWaterCount === 0} className="btn-secondary">
            <span className="inline-flex items-center justify-center gap-1.5"><Icon name="undo" size={15} />撤销</span>
          </button>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今日三餐</h2>
          <span className="muted">{todayTotal} / {state.calorieGoal} kcal</span>
        </div>
        <p className="muted">{remaining >= 0 ? `距离目标还剩 ${remaining} kcal` : `今天多出 ${Math.abs(remaining)} kcal，也没关系`}</p>
        {remaining < 0 && !todayLog.isCheatDay && (
          <button
            onClick={() => { dispatch({ type: 'MARK_CHEAT', date: today }); notify('放纵餐已标记，诚实记录值得一颗星'); }}
            className="btn-secondary w-full text-xs"
          >
            标记为放纵餐 · +1 星
          </button>
        )}
        {todayLog.isCheatDay && <p className="rounded-2xl bg-coralSoft p-2.5 text-xs text-coralInk">今天已标记为放纵餐，快乐也被认真收下了。</p>}

        <div className="space-y-2">
          {mealOrder.map((meal) => {
            const records = grouped[meal];
            const total = records.reduce((sum, r) => sum + r.calories, 0);
            return (
              <div key={meal} className="rounded-2xl bg-warm p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{mealLabels[meal]}</p>
                    <p className="muted">{total} kcal · {records.length} 项</p>
                  </div>
                  <button
                    onClick={() => setManualMeal(meal)}
                    className="icon-btn h-8 w-8 bg-avocado text-avocadoInk"
                    aria-label={`添加${mealLabels[meal]}`}
                  >
                    <Icon name="plus" size={17} />
                  </button>
                </div>
                {records.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {records.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => openEditor(today, record)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-2.5 py-2 text-left active:scale-[0.99]"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Icon name={record.source === 'photo' ? 'camera' : 'edit'} size={13} className="shrink-0 text-muted" />
                          <span className="truncate text-xs text-ink">{record.name}</span>
                          <span className="shrink-0 text-[10px] text-muted">{record.amount ?? 1}份</span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-ink">{record.calories} kcal</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">陪分身走走</h2>
          <span className="muted">{todaySteps} 步</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-avocadoSoft text-avocadoInk"><Icon name="walk" size={21} /></span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">十分钟小散步</p>
            <p className="muted">走完就能领今天的走路星星</p>
          </div>
          <button onClick={syncWalk} className="btn-secondary px-3 py-2 text-xs">同步</button>
        </div>
        <button
          onClick={() => setHealthOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-warm px-3 py-2.5 text-xs text-ink active:scale-[0.99]"
        >
          <span>{state.healthConnected ? '健康数据已连接' : '连接健康数据'}</span>
          <Icon name="chevronRight" size={15} className="text-muted" />
        </button>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">小日历</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="icon-btn h-8 w-8" aria-label="上个月"><Icon name="chevronLeft" size={16} /></button>
            <span className="text-xs text-ink">{viewDate.getFullYear()}年{viewDate.getMonth() + 1}月</span>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="icon-btn h-8 w-8" aria-label="下个月"><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-muted">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.key) return <div key={`blank-${i}`} />;
            const log = state.logs[cell.key];
            const total = log?.records.reduce((sum, r) => sum + r.calories, 0) ?? 0;
            const isToday = cell.key === today;
            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(cell.key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-[11px] active:scale-95 ${
                  isToday ? 'bg-avocado text-avocadoInk' : 'bg-warm text-ink'
                }`}
              >
                <span>{cell.day}</span>
                <span className="mt-0.5 h-3 text-[8px] leading-3">{log?.isCheatDay ? '★' : total > 0 ? total : ''}</span>
              </button>
            );
          })}
        </div>
        <p className="muted">星标 = 放纵餐 · 数字 = 当日热量</p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">照片小记</h2>
          <span className="muted">只留给自己看</span>
        </div>
        <input ref={timelineInput} type="file" accept="image/*" onChange={handleTimeline} className="hidden" />
        <button onClick={() => timelineInput.current?.click()} className="btn-secondary w-full text-xs">添加一张照片</button>
        {pendingPhoto && (
          <div className="space-y-2">
            <img src={pendingPhoto} alt="待保存" className="h-40 w-full rounded-2xl object-cover" />
            <button
              onClick={() => { dispatch({ type: 'ADD_PHOTO', photo: { date: today, imageDataUrl: pendingPhoto } }); setPendingPhoto(null); notify('照片收好啦'); }}
              className="btn-primary w-full text-xs"
            >
              保存照片
            </button>
          </div>
        )}
        {state.photoTimeline.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted">还没有照片，随时都可以开始。</p>
        ) : (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {state.photoTimeline.map((photo, i) => (
              <img key={`${photo.date}-${i}`} src={photo.imageDataUrl} alt={formatDateCN(photo.date, false)} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />

      <Modal open={!!manualMeal} onClose={() => setManualMeal(null)} title={manualMeal ? `添加${mealLabels[manualMeal]}` : ''}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="食物名称" className="w-full rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="份数" inputMode="decimal" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <input value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} placeholder="蛋白质 g（选填）" inputMode="numeric" className="rounded-2xl bg-warm px-3 py-2.5 text-xs text-ink outline-none" />
            <input value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} placeholder="碳水 g（选填）" inputMode="numeric" className="rounded-2xl bg-warm px-3 py-2.5 text-xs text-ink outline-none" />
            <input value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} placeholder="脂肪 g（选填）" inputMode="numeric" className="col-span-2 rounded-2xl bg-warm px-3 py-2.5 text-xs text-ink outline-none" />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink/75">
            <input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />
            这是放纵餐，如实记录（额外 +1 星）
          </label>
          <button onClick={saveManual} className="btn-primary w-full">记下来啦</button>
        </div>
      </Modal>

      <Modal open={!!photoPreview} onClose={() => { setPhotoPreview(null); setResult(null); }} title="拍照识别">
        <div className="space-y-3">
          <p className="muted leading-relaxed">演示识别，接口预留于 recognizeFood.ts，正式接入后页面无需改动。</p>
          {photoPreview && <img src={photoPreview} alt="食物预览" className="h-44 w-full rounded-2xl object-cover" />}
          <div className="flex flex-wrap gap-2">
            {mealOrder.filter((meal) => meal !== 'unknown').map((meal) => (
              <button key={meal} onClick={() => setPhotoMeal(meal)} className={`chip text-xs ${photoMeal === meal ? 'bg-avocado text-avocadoInk' : 'bg-warm text-muted'}`}>
                {mealLabels[meal]}
              </button>
            ))}
          </div>
          <input value={photoAmount} onChange={(e) => setPhotoAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-warm px-4 py-2.5 text-sm text-ink outline-none" />
          {recognizing ? (
            <p className="py-6 text-center text-sm text-muted">正在偷偷看图…</p>
          ) : result ? (
            <div className="space-y-2 rounded-2xl bg-warm p-3">
              <p className="font-semibold text-ink">识别到：{result.name}</p>
              <p className="text-xs text-ink/75">约 {result.calories} kcal · 蛋白 {result.protein}g / 碳水 {result.carbs}g / 脂肪 {result.fat}g</p>
              <p className="text-xs text-avocadoInk">{result.feedback}</p>
              <button onClick={saveRecognized} className="btn-primary w-full">就它了，存入记录</button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="修改这一餐">
        {editing && (
          <div className="space-y-3">
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={editForm.calories} onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })} inputMode="numeric" placeholder="热量 kcal" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
              <input value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} inputMode="decimal" placeholder="份数" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
              <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} placeholder="时间 HH:mm" className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none" />
              <select value={editForm.meal} onChange={(e) => setEditForm({ ...editForm, meal: e.target.value as MealType })} className="rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none">
                {mealOrder.filter((meal) => meal !== 'unknown').map((meal) => <option key={meal} value={meal}>{mealLabels[meal]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={deleteRecord} className="btn-secondary text-coralInk">删除</button>
              <button onClick={saveEditor} className="btn-primary">保存修改</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? formatDateCN(selectedDate) : ''}>
        {selectedLog ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">这一天共记录 {selectedLog.records.length} 餐。</p>
            <div className="space-y-2">
              {selectedLog.records.map((record) => (
                <button key={record.id} onClick={() => { setSelectedDate(null); openEditor(selectedDate!, record); }} className="flex w-full items-center justify-between rounded-2xl bg-warm px-3 py-2.5 text-left text-xs">
                  <span className="truncate text-ink">{record.name}</span>
                  <span className="shrink-0 font-medium text-ink">{record.calories} kcal</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">这一天还空空的，随时可以补记。</p>
        )}
      </Modal>

      <Modal open={cupOpen} onClose={() => setCupOpen(false)} title="自定义水杯">
        <div className="space-y-3">
          <input value={cupLabel} onChange={(e) => setCupLabel(e.target.value)} placeholder="杯子名字" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" />
          <input value={cupCapacity} onChange={(e) => setCupCapacity(e.target.value)} inputMode="numeric" placeholder="容量 ml" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" />
          <div className="flex gap-2">
            {cupColors.map((color) => (
              <button
                key={color}
                onClick={() => setCupColor(color)}
                className={`h-8 w-8 rounded-full border-2 transition-transform active:scale-90 ${cupColor === color ? 'border-ink' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
                aria-label={`选择颜色 ${color}`}
              />
            ))}
          </div>
          <button onClick={saveCup} className="btn-primary w-full">用这个杯子</button>
        </div>
      </Modal>

      <Modal open={healthOpen} onClose={() => setHealthOpen(false)} title="健康数据">
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-ink/80">演示版会模拟同步一段散步数据。绝不读取你的健康档案，也不需要授权真实信息。</p>
          <button
            onClick={() => {
              dispatch({ type: 'SET_HEALTH_CONNECTED', connected: !state.healthConnected });
              notify(state.healthConnected ? '已断开模拟同步' : '模拟同步已连接');
              setHealthOpen(false);
            }}
            className={state.healthConnected ? 'btn-secondary w-full' : 'btn-primary w-full'}
          >
            {state.healthConnected ? '断开模拟同步' : '连接模拟同步'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
