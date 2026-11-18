import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import Modal from '../components/Modal';
import { ProgressRing } from '../components/Gauges';
import { useApp } from '../context/AppContext';
import type { FoodRecord, MealType, RecognitionResult } from '../types';
import { formatDateCN, monthCells, todayKey } from '../utils/date';
import { isLikelyCheat, recognizeFood } from '../utils/recognizeFood';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};

const mealEmoji: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
};

function inferMeal(record: FoodRecord): MealType {
  if (record.mealType) return record.mealType;
  const hour = new Date().getHours();
  return hour < 10 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner';
}

export default function RecordPage() {
  const { state, dispatch, todayLog, todayTotal, todayWater, remaining } = useApp();
  const today = todayKey();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [photoMeal, setPhotoMeal] = useState<MealType>('lunch');
  const [manualMeal, setManualMeal] = useState<MealType | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', honest: false });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const timelineInput = useRef<HTMLInputElement>(null);

  const viewDate = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset, today]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;
  const percent = Math.min(100, Math.round((todayTotal / state.calorieGoal) * 100));
  const isOver = todayTotal > state.calorieGoal;

  const grouped = useMemo(() => {
    const map: Record<MealType, FoodRecord[]> = { breakfast: [], lunch: [], dinner: [] };
    todayLog.records.forEach((record) => map[inferMeal(record)].push(record));
    return map;
  }, [todayLog.records]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setPhotoPreview(url);
      setResult(null);
      setRecognizing(true);
      setPhotoMeal(inferMeal({ id: '', date: today, name: '', calories: 0, source: 'photo' }));
      const recognized = await recognizeFood(url);
      setResult(recognized);
      setRecognizing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveRecognized = () => {
    if (!result) return;
    dispatch({
      type: 'ADD_RECORD',
      record: {
        id: uid(),
        date: today,
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        source: 'photo',
        mealType: photoMeal,
        feedback: result.feedback,
        honestStar: isLikelyCheat(result),
      },
    });
    setPhotoPreview(null);
    setResult(null);
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!manualMeal || !form.name.trim() || !calories || calories <= 0) return;
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
        feedback: '亲手记下来的这一餐，分身给你比了个大拇指。',
        honestStar: form.honest,
      },
    });
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', honest: false });
    setManualMeal(null);
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
    <div className="px-4 pt-6 pb-32 space-y-4">
      <div>
        <p className="muted">记录不是考试，是给自己一个拥抱</p>
        <h1 className="text-2xl font-bold mt-1">今天也记下来啦</h1>
      </div>

      <section className="rounded-3xl bg-avocado text-white p-5 flex items-center gap-4 shadow-pop">
        <ProgressRing percent={(state.streakDays % 7) / 7 * 100} label={`${state.streakDays}`} sublabel="连续天" />
        <div>
          <p className="text-xs text-white/80">你的坚持正在发芽</p>
          <h2 className="text-xl font-bold mt-1">连续记录 {state.streakDays} 天</h2>
          <p className="text-[11px] text-white/75 mt-2">每一次记录，都值得一颗小星星。</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button className="card text-left" onClick={() => document.getElementById('intake-detail')?.scrollIntoView({ behavior: 'smooth' })}>
          <p className="muted">今日总摄入</p>
          <p className="text-xl font-bold text-avocadoDark mt-2">{todayTotal}<span className="text-xs font-normal text-muted ml-1">kcal</span></p>
          <p className="muted mt-1">目标 {state.calorieGoal} kcal</p>
        </button>
        <button className="card text-left" onClick={() => dispatch({ type: 'ADD_WATER', date: today })}>
          <div className="flex items-center justify-between">
            <p className="muted">今日饮水</p>
            <span className="text-lg">💧</span>
          </div>
          <p className="text-xl font-bold text-avocadoDark mt-2">{todayWater}<span className="text-xs font-normal text-muted ml-1">杯</span></p>
          <p className="muted mt-1">点一下 +1 杯</p>
        </button>
      </div>

      <section id="intake-detail" className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">三餐记录</h2>
          <span className="muted">{formatDateCN(today, false)}</span>
        </div>
        <div className="h-2 rounded-full bg-cream overflow-hidden">
          <div className="h-full bg-avocado rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <p className="muted">{remaining >= 0 ? `距离目标还剩 ${remaining} kcal` : `今天多出 ${Math.abs(remaining)} kcal，也没关系`}</p>
        {isOver && !todayLog.isCheatDay && (
          <button onClick={() => dispatch({ type: 'MARK_CHEAT', date: today })} className="btn-ghost w-full text-xs">
            🎂 标记为放纵餐（+1 诚实星）
          </button>
        )}
        {todayLog.isCheatDay && <p className="text-xs text-avocadoDark">🍰 今天已标记为放纵餐，诚实记录很可爱。</p>}

        <div className="space-y-2 pt-1">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
            const records = grouped[meal];
            const total = records.reduce((sum, r) => sum + r.calories, 0);
            return (
              <div key={meal} className="bg-cream rounded-3xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mealEmoji[meal]}</span>
                    <div>
                      <p className="text-sm font-semibold">{mealLabels[meal]}</p>
                      <p className="muted">{total} kcal · {records.length} 项</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setManualMeal(meal)}
                    className="w-8 h-8 rounded-full bg-avocado text-white text-lg leading-none"
                    aria-label={`添加${mealLabels[meal]}`}
                  >
                    +
                  </button>
                </div>
                {records.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {records.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-[11px] text-ink/75">
                        <span>{r.source === 'photo' ? '📷' : '✍️'} {r.name}</span>
                        <span>{r.calories} kcal</span>
                      </div>
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
          <h2 className="section-title">小日历</h2>
          <div className="flex items-center gap-3 text-xs text-avocadoDark">
            <button onClick={() => setMonthOffset((m) => m - 1)}>‹</button>
            <span className="text-ink text-sm">{viewDate.getFullYear()}年{viewDate.getMonth() + 1}月</span>
            <button onClick={() => setMonthOffset((m) => m + 1)}>›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-muted">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.key) return <div key={`blank-${i}`} />;
            const log = state.logs[cell.key];
            const total = log?.records.reduce((s, r) => s + r.calories, 0) ?? 0;
            const isToday = cell.key === today;
            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(cell.key)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-[11px] ${
                  isToday ? 'bg-avocado text-white' : 'bg-cream/60'
                }`}
              >
                <span>{cell.day}</span>
                <span className="text-[8px] mt-0.5 h-3 leading-3">
                  {log?.isCheatDay ? '🍰' : total > 0 ? total : ''}
                </span>
              </button>
            );
          })}
        </div>
        <p className="muted">🍰 = 放纵餐 · 数字 = 当日热量，点格子看详情</p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">体型照片时间轴</h2>
          <span className="muted">悄悄记录变化</span>
        </div>
        <input ref={timelineInput} type="file" accept="image/*" onChange={handleTimeline} className="hidden" />
        <button onClick={() => timelineInput.current?.click()} className="btn-ghost w-full text-xs">📸 添加一张照片</button>
        {pendingPhoto && (
          <div className="space-y-2">
            <img src={pendingPhoto} alt="待保存" className="w-full h-40 object-cover rounded-2xl" />
            <button
              onClick={() => {
                dispatch({ type: 'ADD_PHOTO', photo: { date: today, imageDataUrl: pendingPhoto } });
                setPendingPhoto(null);
              }}
              className="btn-primary w-full text-xs"
            >
              保存到时间轴
            </button>
          </div>
        )}
        {state.photoTimeline.length === 0 ? (
          <p className="text-xs text-muted text-center py-3">还没有照片，随时都可以开始。</p>
        ) : (
          <div className="space-y-3">
            {state.photoTimeline.map((photo, i) => (
              <div key={`${photo.date}-${i}`} className="flex gap-3 items-center">
                <img src={photo.imageDataUrl} alt={photo.date} className="w-20 h-20 object-cover rounded-2xl" />
                <div>
                  <p className="text-sm font-medium">{formatDateCN(photo.date, false)}</p>
                  <p className="muted">存下今天的自己，就很棒。</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      <button
        onClick={() => photoInput.current?.click()}
        className="fixed bottom-[96px] left-1/2 ml-[128px] -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-avocado text-white shadow-pop grid place-items-center text-2xl"
        aria-label="拍照识别"
      >
        📷
      </button>

      <Modal open={!!manualMeal} onClose={() => setManualMeal(null)} title={manualMeal ? `添加${mealLabels[manualMeal]}` : ''}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="食物名称" className="col-span-2 bg-cream rounded-2xl px-3 py-2 text-sm outline-none" />
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="col-span-2 bg-cream rounded-2xl px-3 py-2 text-sm outline-none" />
            {(['protein', 'carbs', 'fat'] as const).map((key) => (
              <input
                key={key}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={`${key === 'protein' ? '蛋白质' : key === 'carbs' ? '碳水' : '脂肪'} g（选填）`}
                inputMode="numeric"
                className="bg-cream rounded-2xl px-3 py-2 text-xs outline-none"
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-ink/70">
            <input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />
            这是放纵餐，如实记录（额外 +1 诚实星）
          </label>
          <button onClick={saveManual} className="btn-primary w-full text-sm">记下来啦</button>
        </div>
      </Modal>

      <Modal open={!!photoPreview} onClose={() => { setPhotoPreview(null); setResult(null); }} title="拍照识别">
        <div className="space-y-3">
          <p className="muted">演示数据，正式版将接入真实识别 · 接口预留于 src/utils/recognizeFood.ts</p>
          {photoPreview && <img src={photoPreview} alt="食物预览" className="w-full h-44 object-cover rounded-2xl" />}
          <div className="flex gap-2">
            {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => (
              <button key={meal} onClick={() => setPhotoMeal(meal)} className={`chip text-xs ${photoMeal === meal ? 'bg-avocado text-white' : 'bg-cream text-muted'}`}>
                {mealLabels[meal]}
              </button>
            ))}
          </div>
          {recognizing ? (
            <p className="text-sm text-center py-6">正在偷偷看图… 🔍</p>
          ) : result ? (
            <div className="space-y-2 bg-cream rounded-2xl p-3">
              <p className="font-semibold">识别到：{result.name}</p>
              <p className="text-xs text-ink/75">约 {result.calories} kcal · 蛋白 {result.protein}g / 碳水 {result.carbs}g / 脂肪 {result.fat}g</p>
              <p className="text-xs text-avocadoDark">{result.feedback}</p>
              <button onClick={saveRecognized} className="btn-primary w-full text-xs">就它了，存入记录 ✨</button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? formatDateCN(selectedDate) : ''}>
        {selectedLog ? (
          <div className="space-y-3">
            <p className="text-sm">这一天共记录 {selectedLog.records.length} 餐，合计 {selectedLog.records.reduce((s, r) => s + r.calories, 0)} kcal。</p>
            {selectedLog.isCheatDay && <p className="text-sm text-avocadoDark">🍰 已标记为放纵餐，诚实记录值得一颗星。</p>}
            <div className="space-y-2">
              {selectedLog.records.map((r) => (
                <div key={r.id} className="bg-cream rounded-2xl p-3 flex justify-between text-xs">
                  <span>{r.source === 'photo' ? '📷' : '✍️'} {r.name}</span>
                  <span className="font-semibold">{r.calories} kcal</span>
                </div>
              ))}
            </div>
            {!selectedLog.isCheatDay && selectedDate && (
              <button onClick={() => { dispatch({ type: 'MARK_CHEAT', date: selectedDate }); setSelectedDate(null); }} className="btn-ghost w-full text-xs">
                标记为放纵餐（+1 诚实星）
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">这一天还空空的，随时可以补记。</p>
        )}
      </Modal>
    </div>
  );
}
