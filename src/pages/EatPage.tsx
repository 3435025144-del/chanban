import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon, { type IconName } from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { ingredients } from '../data/ingredients';
import { matchRecipes, recipes as allRecipes } from '../data/recipes';
import { recommendationForMeal, recommendations, type Recommendation } from '../data/recommendations';
import { nearbyMerchants, takeoutGuides } from '../data/takeoutGuides';
import type { MealType } from '../types';
import { currentTime, getMealByTime, mealLabels } from '../utils/meal';
import { todayKey } from '../utils/date';

type Mode = 'recommend' | 'takeout' | 'cook' | 'nearby';
type SortMode = 'calorie' | 'frequent';
type Step = 'detail' | 'confirm' | 'result';

interface Candidate {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  category: string;
  detail: string;
  avoid?: string;
  tip?: string;
  steps?: string[];
  kind: string;
  frequency: number;
}

const modes: { id: Mode; label: string; icon: IconName }[] = [
  { id: 'takeout', label: '点外卖', icon: 'eat' },
  { id: 'cook', label: '自己做', icon: 'sparkle' },
  { id: 'nearby', label: '附近好店', icon: 'search' },
];

const chips = ['有点饿', '想吃热的', '30元以内', '清淡偏好'];
const sortLabel: Record<SortMode, string> = { calorie: '按热量从低到高', frequent: '按常吃优先' };

function titleForNow(): string {
  const meal = getMealByTime();
  const label = meal === 'unknown' ? '今天' : mealLabels[meal];
  return `${label}，吃什么？`;
}

export default function EatPage() {
  const { state, dispatch, todayTotal, notify } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('recommend');
  const [activeChips, setActiveChips] = useState<string[]>(['有点饿', '想吃热的']);
  const [recommendIndex, setRecommendIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [takeoutCategory, setTakeoutCategory] = useState('全部');
  const [nearbyCategory, setNearbyCategory] = useState('全部');
  const [takeoutSort, setTakeoutSort] = useState<SortMode>('calorie');
  const [nearbySort, setNearbySort] = useState<SortMode>('calorie');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [active, setActive] = useState<Candidate | null>(null);
  const [step, setStep] = useState<Step>('detail');
  const [amount, setAmount] = useState('1');
  const [meal, setMeal] = useState<MealType>(() => getMealByTime());

  const keyword = query.trim().toLowerCase();
  const matches = (...values: (string | number | undefined)[]) =>
    !keyword || values.some((value) => String(value ?? '').toLowerCase().includes(keyword));

  const filteredRecommendations = useMemo(() => {
    let list = recommendations;
    if (activeChips.includes('30元以内')) list = list.filter((item) => item.price <= 30);
    if (activeChips.includes('想吃热的')) list = list.filter((item) => item.minutes >= 15);
    if (activeChips.includes('清淡偏好')) list = list.filter((item) => item.calories <= 520);
    return list.length ? list : [recommendationForMeal(getMealByTime())];
  }, [activeChips]);

  const current = filteredRecommendations[recommendIndex % filteredRecommendations.length];

  const takeoutList = useMemo(
    () =>
      takeoutGuides
        .filter((g) => takeoutCategory === '全部' || g.category === takeoutCategory)
        .filter((g) => matches(g.brand, g.category, g.orderTip, g.avoid))
        .slice()
        .sort((a, b) => (takeoutSort === 'calorie' ? a.calories - b.calories : b.frequency - a.frequency)),
    [takeoutCategory, takeoutSort, keyword],
  );

  const nearbyList = useMemo(
    () =>
      nearbyMerchants
        .filter((m) => nearbyCategory === '全部' || m.category === nearbyCategory)
        .filter((m) => matches(m.name, m.type, m.dish, m.category))
        .slice()
        .sort((a, b) => (nearbySort === 'calorie' ? a.avgCalories - b.avgCalories : b.frequency - a.frequency)),
    [nearbyCategory, nearbySort, keyword],
  );

  const recommended = useMemo(() => matchRecipes(selectedIngredients), [selectedIngredients]);
  const recipes = useMemo(() => {
    if (!keyword) return recommended;
    return allRecipes.filter((recipe) =>
      matches(recipe.name, recipe.tag, recipe.tip, ...recipe.ingredients.map((id) => ingredients.find((item) => item.id === id)?.name ?? id)),
    );
  }, [recommended, keyword]);

  const toggleChip = (chip: string) => {
    setActiveChips((prev) => (prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]));
    setRecommendIndex(0);
  };

  const recordRecommendation = () => {
    dispatch({
      type: 'ADD_RECORD',
      record: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: todayKey(),
        name: current.name,
        calories: current.calories,
        source: 'eat',
        mealType: getMealByTime(),
        time: currentTime(),
        amount: 1,
        sourceLabel: '今日推荐',
        feedback: '这一餐被认真选好了，分身给你鼓掌。',
      },
    });
    notify(`已记下「${current.name}」，收到一颗星`);
    setRecommendIndex((i) => i + 1);
  };

  const openDetail = (candidate: Candidate) => {
    setActive(candidate);
    setStep('detail');
    setAmount('1');
    setMeal(getMealByTime());
  };

  const confirmRecord = () => {
    if (!active) return;
    const portion = Math.min(10, Math.max(0.1, Number(amount) || 1));
    dispatch({
      type: 'ADD_RECORD',
      record: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: todayKey(),
        name: active.name,
        calories: Math.round(active.calories * portion),
        source: 'eat',
        mealType: meal,
        time: currentTime(),
        amount: portion,
        sourceLabel: active.kind,
        feedback: '好好吃饭这件事，分身已经替你鼓掌啦。',
      },
    });
    notify('这一餐记下来了，收到一颗星');
    setStep('result');
  };

  const closeModal = () => {
    setActive(null);
    setStep('detail');
  };

  const totalCalories = active ? Math.round(active.calories * (Math.min(10, Math.max(0.1, Number(amount) || 1)))) : 0;

  return (
    <div className="space-y-4 px-4 pb-40 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted">今天想吃点什么？</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-ink">{titleForNow()}</h1>
        </div>
        <Link to="/avatar" className="relative shrink-0 rounded-[20px] bg-warm p-1 shadow-card" aria-label="查看分身">
          <Avatar config={state.avatar.equipped} size={46} />
          <span className="absolute -right-0.5 top-1 h-2.5 w-2.5 rounded-full bg-avocado ring-2 ring-white" />
        </Link>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => toggleChip(chip)}
            className={`chip shrink-0 text-xs ${activeChips.includes(chip) ? 'bg-avocadoSoft text-avocado shadow-card' : 'bg-warm text-muted'}`}
          >
            {chip}
          </button>
        ))}
      </div>

      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-coralSoft to-[#FFF9F2] p-5 shadow-card">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/50 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-coralDeep"><Icon name="sparkle" size={14} />小馋替你选好了</p>
          <span className="text-[11px] text-muted">适合现在</span>
        </div>
        <div className="relative mt-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold leading-tight text-ink">{current.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{current.desc}</p>
            <span className="mt-3 inline-block rounded-full bg-white px-3 py-1.5 text-[11px] text-coralDeep shadow-card">{current.tag}</span>
          </div>
          <div className={`grid h-28 w-28 shrink-0 place-items-center rounded-[24px] bg-gradient-to-br ${current.bg} shadow-card`}>
            <span className="text-5xl">{current.emoji}</span>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-3 text-[11px] text-muted">
          <span>约 {current.calories} kcal</span><span>·</span><span>约 {current.price} 元</span><span>·</span><span>{current.minutes} 分钟</span>
        </div>
        <div className="relative mt-4 grid grid-cols-[1.5fr_1fr] gap-2">
          <button onClick={recordRecommendation} className="btn-primary">就吃这个</button>
          <button
            onClick={() => setRecommendIndex((i) => i + 1)}
            className="btn-secondary flex items-center justify-center gap-1.5"
          >
            <Icon name="undo" size={16} />换一个
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">换种方式选</h2>
          <span className="muted">都可以再调整</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(mode === item.id ? 'recommend' : item.id)}
              className={`card flex flex-col items-start gap-3 py-4 text-left active:scale-[0.98] ${mode === item.id ? 'ring-2 ring-avocado' : ''}`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-2xl ${item.id === 'takeout' ? 'bg-avocadoSoft text-avocado' : item.id === 'cook' ? 'bg-coralSoft text-coral' : 'bg-water text-waterInk'}`}>
                <Icon name={item.icon} size={19} />
              </span>
              <span className="text-sm font-semibold text-ink">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === 'recommend' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">最近常点</h2>
            <span className="muted">按你今晚的状态</span>
          </div>
          {recommendations.slice(1, 3).map((item) => (
            <button
              key={item.id}
              onClick={() =>
                openDetail({
                  id: item.id,
                  name: item.name,
                  emoji: item.emoji,
                  calories: item.calories,
                  category: item.tag,
                  detail: item.desc,
                  kind: '最近常点',
                  frequency: 3,
                })
              }
              className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.bg} text-xl`}>{item.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                <span className="muted mt-0.5 block truncate">{item.tag} · 常点 3 次</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-ink">{item.calories} kcal</span>
            </button>
          ))}
        </section>
      )}

      {mode !== 'recommend' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">{mode === 'takeout' ? '外卖攻略' : mode === 'cook' ? '冰箱里有什么' : '附近好店'}</h2>
            <button onClick={() => setMode('recommend')} className="text-xs text-avocado">看推荐</button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-card">
            <Icon name="search" size={17} className="text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜一搜想吃的" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none" />
            {query && <button onClick={() => setQuery('')} className="icon-btn h-7 w-7" aria-label="清空"><Icon name="close" size={14} /></button>}
          </div>

          {mode === 'takeout' && (
            <>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {['全部', ...Array.from(new Set(takeoutGuides.map((g) => g.category)))].map((category) => (
                  <button key={category} onClick={() => setTakeoutCategory(category)} className={`chip shrink-0 text-xs ${takeoutCategory === category ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{category}</button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="muted">共 {takeoutList.length} 条</p>
                <select value={takeoutSort} onChange={(e) => setTakeoutSort(e.target.value as SortMode)} className="rounded-full bg-warm px-3 py-1.5 text-[11px] text-ink outline-none">
                  <option value="calorie">{sortLabel.calorie}</option>
                  <option value="frequent">{sortLabel.frequent}</option>
                </select>
              </div>
              {takeoutList.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => openDetail({ id: guide.id, name: guide.brand, emoji: guide.emoji, calories: guide.calories, category: guide.category, detail: guide.orderTip, avoid: guide.avoid, kind: `外卖攻略 · ${guide.brand}`, frequency: guide.frequency })}
                  className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warm text-xl">{guide.emoji}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{guide.brand}</span><span className="muted block truncate">{guide.category} · 常点 {guide.frequency} 次</span></span>
                  <span className="shrink-0 text-sm font-bold text-ink">{guide.calories} kcal</span>
                </button>
              ))}
              {takeoutList.length === 0 && <p className="py-6 text-center text-xs text-muted">没找到相关攻略，换个词试试。</p>}
            </>
          )}

          {mode === 'cook' && (
            <>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((item) => (
                  <button key={item.id} onClick={() => setSelectedIngredients((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])} className={`chip text-xs ${selectedIngredients.includes(item.id) ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{item.emoji} {item.name}</button>
                ))}
              </div>
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => openDetail({ id: recipe.id, name: recipe.name, emoji: recipe.emoji, calories: recipe.calories, category: recipe.tag, detail: `用 ${recipe.ingredients.map((id) => ingredients.find((i) => i.id === id)?.name ?? id).join('、')} 就能做。`, tip: recipe.tip, steps: recipe.steps, kind: '自己做', frequency: 0 })}
                  className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-avocadoSoft text-xl">{recipe.emoji}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{recipe.name}</span><span className="muted block truncate">{recipe.tag} · 约 {recipe.calories} kcal</span></span>
                  <Icon name="chevronRight" size={16} className="text-muted" />
                </button>
              ))}
              {recipes.length === 0 && <p className="py-6 text-center text-xs text-muted">选几样食材，或换个关键词。</p>}
            </>
          )}

          {mode === 'nearby' && (
            <>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {['全部', ...Array.from(new Set(nearbyMerchants.map((m) => m.category)))].map((category) => (
                  <button key={category} onClick={() => setNearbyCategory(category)} className={`chip shrink-0 text-xs ${nearbyCategory === category ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{category}</button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="muted">附近好选择 · 演示数据</p>
                <select value={nearbySort} onChange={(e) => setNearbySort(e.target.value as SortMode)} className="rounded-full bg-warm px-3 py-1.5 text-[11px] text-ink outline-none">
                  <option value="calorie">{sortLabel.calorie}</option>
                  <option value="frequent">{sortLabel.frequent}</option>
                </select>
              </div>
              {nearbyList.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => openDetail({ id: shop.id, name: shop.name, emoji: shop.emoji, calories: shop.avgCalories, category: shop.category, detail: `${shop.type} · ${shop.dish}`, kind: `附近好店 · ${shop.name}`, frequency: shop.frequency })}
                  className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-water text-xl">{shop.emoji}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{shop.name}</span><span className="muted block truncate">{shop.dish} · {shop.distance}</span></span>
                  <span className="shrink-0 text-sm font-bold text-ink">{shop.avgCalories} kcal</span>
                </button>
              ))}
              {nearbyList.length === 0 && <p className="py-6 text-center text-xs text-muted">没找到相关店，换个词试试。</p>}
            </>
          )}
        </section>
      )}

      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2 px-4">
        <div className="card flex items-center gap-3 rounded-[20px] bg-avocadoSoft/95 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white text-avocado"><Icon name="list" size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">今天已摄入 {todayTotal} / {state.calorieGoal} kcal</p>
            <p className="muted">早餐已记录</p>
          </div>
          <Link to="/record" className="btn-primary px-4 py-2 text-xs">去记录</Link>
        </div>
      </div>

      <Modal open={!!active} onClose={closeModal} title={active ? (step === 'result' ? '记下啦' : step === 'confirm' ? '确认这一餐' : active.name) : ''}>
        {active && step === 'detail' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-warm p-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl">{active.emoji}</span><div><p className="font-semibold text-ink">{active.name}</p><p className="muted">{active.category} · 约 {active.calories} kcal</p></div></div>
            <p className="text-sm leading-relaxed text-ink/80">{active.detail}</p>
            {active.tip && <div className="rounded-2xl bg-coralSoft p-3 text-xs leading-relaxed text-coralDeep">{active.tip}</div>}
            {active.avoid && <p className="muted leading-relaxed">{active.avoid}</p>}
            {active.steps && <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-ink/75">{active.steps.map((item, i) => <li key={i}>{item}</li>)}</ol>}
            <button onClick={() => setStep('confirm')} className="btn-primary w-full">就选它</button>
          </div>
        )}
        {active && step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-warm px-3 py-2.5"><span className="text-sm font-medium text-ink">{active.name}</span><span className="text-sm font-bold text-ink">{totalCalories} kcal</span></div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="份数" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" />
            <div className="flex flex-wrap gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((item) => (
                <button key={item} onClick={() => setMeal(item)} className={`chip text-xs ${meal === item ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{mealLabels[item]}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2"><button onClick={() => setStep('detail')} className="btn-secondary">再看看</button><button onClick={confirmRecord} className="btn-primary">确认记录</button></div>
          </div>
        )}
        {active && step === 'result' && (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-avocado text-white"><Icon name="check" size={28} /></span>
            <div><p className="text-base font-semibold text-ink">{active.name} 已经记好啦</p><p className="muted mt-1">分身收到一颗星，等你去星星盒拆礼物。</p></div>
            <div className="grid grid-cols-2 gap-2"><button onClick={() => { closeModal(); navigate('/avatar'); }} className="btn-primary">去看分身</button><button onClick={closeModal} className="btn-secondary">继续看看</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
