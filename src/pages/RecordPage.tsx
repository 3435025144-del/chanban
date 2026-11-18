import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { FoodRecord, RecognitionResult } from '../types';
import { dateKey, formatDateCN, monthCells, todayKey } from '../utils/date';
import { isLikelyCheat, recognizeFood } from '../utils/recognizeFood';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function RecordPage() {
  const { state, dispatch, todayLog, todayTotal, remaining } = useApp();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', honest: false });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const timelineInput = useRef<HTMLInputElement>(null);

  const viewDate = useMemo(() => {
    const d = new Date(`${todayKey()}T00:00:00`);
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);
  const cells = useMemo(() => monthCells(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const selectedLog = selectedDate ? state.logs[selectedDate] : undefined;
  const percent = Math.min(100, Math.round((todayTotal / state.calorieGoal) * 100));
  const isOver = todayTotal > state.calorieGoal;

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setPhotoPreview(url);
      setResult(null);
      setRecognizing(true);
      const recognized = await recognizeFood(url);
      setResult(recognized);
      setRecognizing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveRecognized = () => {
    if (!result) return;
    const record: FoodRecord = {
      id: uid(),
      date: todayKey(),
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      source: 'photo',
      feedback: result.feedback,
      honestStar: isLikelyCheat(result),
    };
    dispatch({ type: 'ADD_RECORD', record });
    setPhotoPreview(null);
    setResult(null);
  };

  const saveManual = () => {
    const calories = Number(form.calories);
    if (!form.name.trim() || !calories || calories <= 0) return;
    const record: FoodRecord = {
      id: uid(),
      date: todayKey(),
      name: form.name.trim(),
      calories,
      protein: form.protein ? Number(form.protein) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fat: form.fat ? Number(form.fat) : undefined,
      source: 'manual',
      feedback: '亲手记下来的这一餐，分身给你比了个大拇指。',
      honestStar: form.honest,
    };
    dispatch({ type: 'ADD_RECORD', record });
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', honest: false });
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
    <div className="px-4 pt-6 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">今天吃了什么呀？</h1>
        <p className="muted mt-1">记下来就是胜利，分身只负责鼓掌 👏</p>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">拍照识别记一餐</h2>
          <span className="text-[10px] bg-peach text-coralDark px-2 py-0.5 rounded-full">+1 星</span>
        </div>
        <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        <button onClick={() => photoInput.current?.click()} className="w-full border-2 border-dashed border-coral/30 rounded-2xl py-6 bg-peach/40 text-coralDark text-sm">
          📷 拍照 / 上传食物照片
        </button>
        <p className="text-[10px] text-muted leading-relaxed">
          演示数据，正式版将接入真实识别 · 接口预留于 <code className="bg-cream px-1 rounded">src/utils/recognizeFood.ts</code>
        </p>
        {photoPreview && (
          <div className="flex gap-3 items-start">
            <img src={photoPreview} alt="食物预览" className="w-20 h-20 object-cover rounded-xl" />
            <div className="flex-1 text-xs text-ink/75">
              {recognizing ? (
                <p className="py-3">正在偷偷看图… 🔍</p>
              ) : result ? (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">识别到：{result.name}</p>
                  <p>
                    约 {result.calories} kcal · 蛋白 {result.protein}g / 碳水 {result.carbs}g / 脂肪 {result.fat}g
                  </p>
                  <p className="text-coralDark">{result.feedback}</p>
                  <button onClick={saveRecognized} className="btn-primary w-full mt-2 py-1.5 text-xs">
                    就它了，存入记录 ✨
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">手动添加</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="食物名称"
            className="col-span-2 bg-cream rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
          />
          <input
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            placeholder="热量 kcal"
            inputMode="numeric"
            className="bg-cream rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30 col-span-2"
          />
          {(['protein', 'carbs', 'fat'] as const).map((key) => (
            <input
              key={key}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={`${key === 'protein' ? '蛋白质' : key === 'carbs' ? '碳水' : '脂肪'} g（选填）`}
              inputMode="numeric"
              className="bg-cream rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-coral/30"
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-ink/70">
          <input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />
          这是放纵餐，如实记录（额外 +1 诚实星）
        </label>
        <button onClick={saveManual} className="btn-primary w-full text-sm">记下来啦</button>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今日小账本</h2>
          <span className="muted">{formatDateCN(todayKey(), false)}</span>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-[11px] text-muted">已记录</p>
            <p className="text-2xl font-bold text-coralDark">{todayTotal}<span className="text-xs font-normal text-muted ml-1">kcal</span></p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-muted">距离目标</p>
            <p className="text-sm font-semibold">{remaining >= 0 ? `还剩 ${remaining}` : `多出 ${Math.abs(remaining)}`} kcal</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-peach overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-coral to-[#FFB65E] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-[11px] text-muted">目标 {state.calorieGoal} kcal · 今天已经记了 {todayLog.records.length} 餐</p>
        {isOver && (
          <div className="bg-mintSoft rounded-xl p-3 space-y-2">
            <p className="text-xs text-ink/75">今天吃得热热闹闹呀，没关系，日子还长着呢。分身已经满足地打了个小嗝～</p>
            {!todayLog.isCheatDay && (
              <button onClick={() => dispatch({ type: 'MARK_CHEAT', date: todayKey() })} className="btn-ghost text-xs">
                🎂 标记为放纵餐（+1 诚实星）
              </button>
            )}
          </div>
        )}
        {todayLog.isCheatDay && <p className="text-xs text-coralDark">🍰 今天已标记为放纵餐，诚实又可爱。</p>}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">小日历</h2>
          <div className="flex items-center gap-3 text-xs text-coralDark">
            <button onClick={() => setMonthOffset((m) => m - 1)}>‹ 上月</button>
            <span className="text-ink text-sm">{viewDate.getFullYear()}年{viewDate.getMonth() + 1}月</span>
            <button onClick={() => setMonthOffset((m) => m + 1)}>下月 ›</button>
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
            const isToday = cell.key === todayKey();
            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(cell.key)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] border transition-colors ${
                  isToday ? 'border-coral bg-peach/60' : 'border-transparent hover:bg-cream'
                }`}
              >
                <span className={isToday ? 'text-coralDark font-bold' : ''}>{cell.day}</span>
                <span className="text-[8px] text-muted mt-0.5 h-3 leading-3">
                  {log?.isCheatDay ? '🍰' : total > 0 ? total : ''}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted">🍰 = 放纵餐标记 · 数字 = 当日总热量，点一格看详情</p>
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
            <img src={pendingPhoto} alt="待保存" className="w-full h-40 object-cover rounded-xl" />
            <button
              onClick={() => {
                dispatch({ type: 'ADD_PHOTO', photo: { date: todayKey(), imageDataUrl: pendingPhoto } });
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
                <img src={photo.imageDataUrl} alt={photo.date} className="w-20 h-20 object-cover rounded-xl" />
                <div>
                  <p className="text-sm font-medium">{formatDateCN(photo.date, false)}</p>
                  <p className="muted">存下今天的自己，就很棒。</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? formatDateCN(selectedDate) : ''}>
        {selectedLog ? (
          <div className="space-y-3">
            <p className="text-sm">这一天共记录 {selectedLog.records.length} 餐，合计 {selectedLog.records.reduce((s, r) => s + r.calories, 0)} kcal。</p>
            {selectedLog.isCheatDay && <p className="text-sm text-coralDark">🍰 已标记为放纵餐，诚实记录值得一颗星。</p>}
            <div className="space-y-2">
              {selectedLog.records.map((r) => (
                <div key={r.id} className="bg-cream rounded-xl p-3 flex justify-between text-xs">
                  <span>{r.source === 'photo' ? '📷' : '✍️'} {r.name}</span>
                  <span className="font-semibold">{r.calories} kcal</span>
                </div>
              ))}
            </div>
            {!selectedLog.isCheatDay && selectedDate && (
              <button
                onClick={() => {
                  dispatch({ type: 'MARK_CHEAT', date: selectedDate });
                  setSelectedDate(null);
                }}
                className="btn-ghost w-full text-xs"
              >
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
