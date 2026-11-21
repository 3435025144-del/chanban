import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import BottomSheet from './BottomSheet';
import Icon, { type IconName } from './Icon';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { cupColors, cupPresets } from '../data/cups';
import type { MealType, RecognitionResult, WaterCup } from '../types';
import { currentTime, getMealByTime, mealLabels } from '../utils/meal';
import { isLikelyCheat, recognizeFood } from '../utils/recognizeFood';
import { todayKey } from '../utils/date';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

function estimateCalories(name: string): number {
  const rules: [RegExp, number][] = [
    [/牛腩饭|牛肉饭|盖饭|丼/, 550], [/番茄.*牛腩|红烧牛肉/, 520], [/汉堡|炸鸡|薯条/, 560],
    [/披萨|比萨/, 600], [/火锅|烧烤/, 700], [/奶茶|果茶/, 350], [/咖啡|美式|拿铁/, 120],
    [/米饭|白饭/, 230], [/面条|拉面|拌面|意面|米粉/, 420], [/饺子|馄饨|包子/, 300],
    [/沙拉|蔬菜|青菜/, 150], [/鸡胸|鸡腿|鸡蛋/, 180], [/鱼|虾|海鲜/, 220], [/豆腐|豆浆/, 140],
    [/红薯|玉米|土豆/, 140], [/粥|汤/, 150], [/苹果|香蕉|橙|水果/, 90], [/牛奶|酸奶/, 130],
    [/面包|吐司|蛋糕/, 240],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] ?? 320;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RecordCenterSheet({ open, onClose }: Props) {
  const { state, dispatch, todayWaterMl, todayWaterCount, notify, showGuide, guideSeen } = useApp();
  const today = todayKey();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [photoMeal, setPhotoMeal] = useState<MealType>(() => getMealByTime());
  const [photoAmount, setPhotoAmount] = useState('1');
  const [confirmName, setConfirmName] = useState('');
  const [confirmCalories, setConfirmCalories] = useState('');
  const [confirmGrams, setConfirmGrams] = useState('200');
  const [manualMeal, setManualMeal] = useState<MealType | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', amount: '1', honest: false });
  const [undoWaterVisible, setUndoWaterVisible] = useState(false);
  const [cupOpen, setCupOpen] = useState(false);
  const [cupLabel, setCupLabel] = useState(state.waterCup.label);
  const [cupCapacity, setCupCapacity] = useState(String(state.waterCup.capacity));
  const [cupColor, setCupColor] = useState(state.waterCup.color);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(activityPresets[0].id);
  const [customActivities, setCustomActivities] = useState<ActivityOption[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [customCalories, setCustomCalories] = useState('');
  const [waterSheetOpen, setWaterSheetOpen] = useState(false);
  const [waterChoice, setWaterChoice] = useState(state.waterCup.id);
  const photoInput = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const waterOptions = useMemo<WaterCup[]>(() => {
    const presets = cupPresets.map((cup) => ({ ...cup }));
    if (state.waterCup.custom && !presets.some((cup) => cup.id === state.waterCup.id)) presets.push(state.waterCup);
    return presets;
  }, [state.waterCup]);
  const selectedWaterCup = waterOptions.find((cup) => cup.id === waterChoice) ?? waterOptions[0];
  const activityOptions = useMemo(() => [...activityPresets, ...customActivities], [customActivities]);
  const selectedActivity = activityOptions.find((item) => item.id === selectedActivityId) ?? activityPresets[0];

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
      imageDataUrl: photoPreview ?? undefined,
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

  const skipMeal = () => {
    if (!manualMeal) return;
    dispatch({ type: 'SET_MEAL_SKIPPED', date: today, meal: manualMeal, skipped: true });
    notify(`${mealLabels[manualMeal]}已记为没吃，不用勉强`);
    setManualMeal(null);
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

  const openCup = () => {
    setCupLabel(state.waterCup.label);
    setCupCapacity(String(state.waterCup.capacity));
    setCupColor(state.waterCup.color);
    setCupOpen(true);
  };
  const saveCup = () => {
    const capacity = Number(cupCapacity);
    if (!capacity || capacity < 50) { notify('杯子容量至少 50ml'); return; }
    const cup: WaterCup = { id: 'custom', label: cupLabel.trim() || '我的杯子', color: cupColor, icon: 'cup', capacity: Math.min(2000, capacity), custom: true };
    dispatch({ type: 'SET_WATER_CUP', cup });
    setCupOpen(false);
    notify(`水杯换成${cup.label}啦`);
  };

  const addCustomCalories = (amount: number) => setCustomCalories(String((Number(customCalories) || 0) + amount));
  const saveCustomActivity = () => {
    const name = customName.trim();
    const minutes = Math.max(0, Math.round(Number(customMinutes) || 0));
    const calories = Math.max(0, Math.round(Number(customCalories) || 0));
    if (!name) { notify('给这项运动起个名字吧'); return; }
    if (minutes < 1) { notify('运动时长至少 1 分钟'); return; }
    if (calories < 1) { notify('预估消耗至少 1 kcal'); return; }
    const option: ActivityOption = { id: `custom-${Date.now()}`, name, meta: `${minutes} 分钟 · 自定义运动`, calories, icon: 'sparkle', custom: true };
    setCustomActivities((list) => [...list, option]);
    setSelectedActivityId(option.id); setCustomOpen(false);
    setCustomName(''); setCustomMinutes('30'); setCustomCalories('');
    notify(`${name}已加入，点确认打卡即可记录`);
  };
  const confirmExercise = () => {
    dispatch({ type: 'ADD_ACTIVITY', date: today, name: selectedActivity.name, calories: selectedActivity.calories, steps: selectedActivity.steps });
    setExerciseOpen(false);
    notify(`${selectedActivity.name}打卡成功，活动消耗 +${selectedActivity.calories} kcal`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="今天想记点什么？" title="记录中心">
      <div className="space-y-3 pb-2">
        <button onClick={() => photoInput.current?.click()} className="rc-hero">
          <span className="rb-eat-orb" aria-hidden="true" />
          <span className="relative z-[1] grid h-10 w-10 place-items-center rounded-2xl bg-card text-primary"><Icon name="camera" size={20} /></span>
          <span className="relative z-[1] text-[17px] font-extrabold text-text">拍照识别卡路里</span>
          <span className="relative z-[1] text-[12px] text-text/70">拍一下，小馋帮你识别食物和热量 · +1星</span>
        </button>

        <div className="rc-tool-grid">
          <button onClick={() => setManualMeal(getMealByTime())} className="rb-tool rb-tool-manual rc-tool">
            <Icon name="chevronRight" size={11} className="rc-tool-arrow" />
            <span className="rb-tool-icon"><Icon name="edit" size={14} /></span>
            <span className="rb-tool-label">手动记录</span>
            <span className="rb-tool-meta">点击去添加</span>
          </button>
          <div className="rb-tool rb-tool-water rc-tool rc-tool-wrap">
            <button onClick={openWaterSheet} className="rc-tool-main">
              <Icon name="chevronRight" size={11} className="rc-tool-arrow rc-tool-arrow-shift" />
              <span className="rb-tool-icon"><Icon name="cup" size={14} /></span>
              <span className="rb-tool-label">喝水</span>
              <span className="rb-tool-meta">去喝水 +1</span>
            </button>
            <button onClick={openCup} className="rc-tool-settings" aria-label="水杯设置"><Icon name="settings" size={11} /></button>
            {undoWaterVisible && <button onClick={undoWater} className="absolute bottom-1 right-1 rounded-full bg-card px-1.5 py-0.5 text-[9px] text-text shadow-card">撤销</button>}
          </div>
          <button onClick={() => setExerciseOpen(true)} className="rb-tool rb-tool-exercise rc-tool">
            <Icon name="chevronRight" size={11} className="rc-tool-arrow" />
            <span className="rb-tool-icon"><Icon name="walk" size={14} /></span>
            <span className="rb-tool-label">运动打卡</span>
            <span className="rb-tool-meta">去打卡 +1星</span>
          </button>
        </div>

        <button onClick={onClose} className="btn-primary w-full">完成，回到首页</button>
      </div>

      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />

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

      <BottomSheet
        open={!!manualMeal}
        onClose={() => setManualMeal(null)}
        eyebrow="手动记录"
        title={manualMeal ? `添加${mealLabels[manualMeal]}` : ''}
        footer={
          <div className="grid grid-cols-2 gap-2 pb-1">
            <button onClick={skipMeal} className="btn-secondary text-xs">今天没吃这一餐</button>
            <button onClick={saveManual} className="btn-primary text-xs">记下来啦</button>
          </div>
        }
      >
        <div className="space-y-4 pb-4">
          <div>
            <p className="mb-2 text-xs font-bold text-text">食物名称</p>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如番茄牛腩饭" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          </div>
          <button onClick={smartEstimate} className="btn-secondary w-full text-xs">智能估算热量</button>
          <div>
            <p className="mb-2 text-xs font-bold text-text">预估热量</p>
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="热量 kcal" inputMode="numeric" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-text">份数</p>
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1" inputMode="decimal" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          </div>
          <p className="muted text-xs">估算只是参考，填好可以随时改。</p>
          <label className="flex items-center gap-2 text-xs text-text/75"><input type="checkbox" checked={form.honest} onChange={(e) => setForm({ ...form, honest: e.target.checked })} />这是放纵餐，如实记录（额外 +1 星）</label>
        </div>
      </BottomSheet>

      <BottomSheet
        open={waterSheetOpen}
        onClose={() => setWaterSheetOpen(false)}
        eyebrow="喝水"
        title="这杯喝多少？"
        footer={
          <div className="space-y-2 pb-1">
            <button onClick={() => { setWaterSheetOpen(false); openCup(); }} className="btn-secondary w-full text-xs">自定义杯子容量与颜色</button>
            <button onClick={confirmWater} className="btn-primary w-full">记下 {selectedWaterCup.capacity} ml</button>
          </div>
        }
      >
        <div className="space-y-3 pb-4">
          <p className="muted">选一个杯量，小馋会按这个容量记下来。</p>
          <div className="grid grid-cols-2 gap-2">
            {waterOptions.map((cup) => {
              const active = selectedWaterCup.id === cup.id;
              return (
                <button key={cup.id} onClick={() => setWaterChoice(cup.id)} className={`flex items-center gap-3 rounded-[18px] p-3 text-left shadow-card ${active ? 'bg-cyanSoft ring-2 ring-cyanText' : 'bg-surface'}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card" style={{ color: cup.color }}><Icon name="cup" size={19} /></span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-bold text-text">{cup.label}</span><span className="block text-[11px] text-textMuted tabular-nums">{cup.capacity} ml</span></span>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        open={exerciseOpen}
        onClose={() => setExerciseOpen(false)}
        eyebrow="运动打卡"
        title="今天想动一动吗？"
        headerExtra={
          <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
            <span className="text-xs text-text/75">今日已打卡 {state.activityLogs.filter((log) => log.date === today).length} 次</span>
            <span className="text-xs font-bold text-cyanText tabular-nums">已消耗 {state.activeCaloriesByDate[today] ?? 0} kcal</span>
          </div>
        }
        footer={
          <div className="space-y-1.5 pb-1">
            <button onClick={confirmExercise} className="btn-primary w-full">确认打卡 · +{selectedActivity.calories} kcal</button>
            <p className="muted text-center text-[11px]">热量为估算值，今日首次打卡还奖励一颗星</p>
          </div>
        }
      >
        <div className="ac-grid pb-6">
          {activityOptions.map((item) => {
            const active = selectedActivityId === item.id;
            return (
              <button key={item.id} onClick={() => setSelectedActivityId(item.id)} className={`ac-card${active ? ' ac-card-active' : ''}`}>
                <span className="ac-card-icon"><Icon name={item.icon} size={14} /></span>
                <span className="ac-card-name">{item.name}</span>
                <span className="ac-card-meta">
                  <span className="ac-card-time">{item.meta}</span>
                  <span className="ac-card-kcal">约 {item.calories} kcal</span>
                </span>
                {active && <span className="ac-card-check"><Icon name="check" size={11} strokeWidth={3} /></span>}
              </button>
            );
          })}
          <button onClick={() => setCustomOpen(true)} className="ac-card ac-card-custom">
            <span className="ac-card-icon"><Icon name="plus" size={14} /></span>
            <span className="ac-card-name">自定义其他运动</span>
            <span className="ac-card-meta">
              <span className="ac-card-time">输入名称和消耗</span>
            </span>
          </button>
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
              {[50, 100, 150, 200].map((amount) => <button key={amount} onClick={() => addCustomCalories(amount)} className="chip bg-card text-xs text-primary">+{amount}</button>)}
              <button onClick={() => setCustomCalories('')} className="chip bg-card text-xs text-textMuted">清空</button>
            </div>
          </div>
          <button onClick={saveCustomActivity} className="btn-primary w-full">加入运动列表</button>
        </div>
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
    </BottomSheet>
  );
}
