import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon, { type IconName } from '../components/Icon';
import { useApp } from '../context/AppContext';
import { ingredients } from '../data/ingredients';
import { matchRecipes, recipes as allRecipes } from '../data/recipes';
import { recommendationForMeal, recommendations } from '../data/recommendations';
import { nearbyMerchants, takeoutGuides } from '../data/takeoutGuides';
import { currentTime, getMealByTime, mealLabels } from '../utils/meal';
import { todayKey } from '../utils/date';

type Mode = 'recommend' | 'takeout' | 'cook' | 'nearby';
type SortMode = 'calorie' | 'frequent';

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

function ingredientNames(ids: string[]): string {
  return ids.map((id) => ingredients.find((item) => item.id === id)?.name ?? id).join('、');
}

interface InfoCardProps {
  emoji: string;
  name: string;
  calories: number;
  iconClass: string;
  recommendLabel: string;
  recommendText: string;
  avoidLabel: string;
  avoidText: string;
}

function InfoCard({ emoji, name, calories, iconClass, recommendLabel, recommendText, avoidLabel, avoidText }: InfoCardProps) {
  return (
    <div className="card rounded-[22px]">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${iconClass}`}>{emoji}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-text">{name}</span>
        <span className="shrink-0 text-xl font-bold text-text">
          {calories}<span className="ml-0.5 text-[10px] font-medium text-textMuted">kcal</span>
        </span>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <p className="text-xs leading-relaxed text-primary">{recommendLabel}：{recommendText}</p>
        <p className="text-xs leading-relaxed text-peachStrong">{avoidLabel}：{avoidText}</p>
      </div>
    </div>
  );
}

export default function EatPage() {
  const { state, dispatch, todayLog, todayTotal, notify, showGuide, guideSeen } = useApp();
  const [mode, setMode] = useState<Mode>('recommend');
  const [activeChips, setActiveChips] = useState<string[]>(['有点饿', '想吃热的']);
  const [recommendIndex, setRecommendIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [takeoutCategory, setTakeoutCategory] = useState('全部');
  const [nearbyCategory, setNearbyCategory] = useState('全部');
  const [takeoutSort, setTakeoutSort] = useState<SortMode>('calorie');
  const [nearbySort, setNearbySort] = useState<SortMode>('calorie');
  const [cookSort, setCookSort] = useState<SortMode>('calorie');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [floatDelta, setFloatDelta] = useState<number | null>(null);
  const floatTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(floatTimer.current), []);

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

  const recordedMeals = Array.from(
    new Set(
      todayLog.records.map((record) =>
        record.mealType && record.mealType !== 'unknown' ? record.mealType : getMealByTime(),
      ),
    ),
  );
  const mealSummary =
    recordedMeals.length === 0
      ? '今天还没记录'
      : recordedMeals.length === 1
        ? `${mealLabels[recordedMeals[0]]}已记录`
        : `已记录${recordedMeals.length}餐`;
  const intakePercent = state.calorieGoal > 0 ? Math.min(100, Math.round((todayTotal / state.calorieGoal) * 100)) : 0;

  const flashCalories = (calories: number) => {
    setFloatDelta(calories);
    window.clearTimeout(floatTimer.current);
    floatTimer.current = window.setTimeout(() => setFloatDelta(null), 1600);
  };

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
        .filter((m) => matches(m.name, m.type, m.dish, m.category, m.recommend, m.avoid))
        .slice()
        .sort((a, b) => (nearbySort === 'calorie' ? a.avgCalories - b.avgCalories : b.frequency - a.frequency)),
    [nearbyCategory, nearbySort, keyword],
  );

  const recommended = useMemo(() => matchRecipes(selectedIngredients), [selectedIngredients]);
  const recipeList = useMemo(() => {
    const list = keyword
      ? allRecipes.filter((recipe) =>
          matches(recipe.name, recipe.tag, recipe.tip, ...recipe.ingredients.map((id) => ingredients.find((item) => item.id === id)?.name ?? id)),
        )
      : recommended;
    return cookSort === 'calorie' ? [...list].sort((a, b) => a.calories - b.calories) : list;
  }, [recommended, keyword, cookSort]);

  const toggleChip = (chip: string) => {
    setActiveChips((prev) => (prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]));
    setRecommendIndex(0);
    setRefreshTick((tick) => tick + 1);
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
    flashCalories(current.calories);
    if (!guideSeen) showGuide();
    setRecommendIndex((i) => i + 1);
  };

  return (
    <div className="space-y-4 px-4 pb-44 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted">今天想吃点什么？</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight text-text">{titleForNow()}</h1>
        </div>
        <Link to="/avatar" className="relative shrink-0 rounded-[20px] bg-surface p-1 shadow-card" aria-label="查看分身">
          <Avatar config={state.avatar.equipped} size={46} />
          <span className="absolute -right-0.5 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
        </Link>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => toggleChip(chip)}
            className={`chip inline-flex shrink-0 items-center gap-1 text-xs ${activeChips.includes(chip) ? 'bg-primary text-primaryText shadow-card' : 'bg-surface text-textMuted'}`}
          >
            {activeChips.includes(chip) && <Icon name="check" size={12} strokeWidth={2.2} />}
            {chip}
          </button>
        ))}
      </div>

      <section key={`recommend-${refreshTick}-${current.id}`} className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-peachSoft to-card p-5 shadow-card animate-refresh">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-card/50 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-peachStrong"><Icon name="sparkle" size={14} />小馋替你选好了</p>
          <span className="text-[11px] text-textMuted">适合现在</span>
        </div>
        <div className="relative mt-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold leading-tight text-text">{current.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text/75">{current.desc}</p>
            <span className="mt-3 inline-block rounded-full bg-card px-3 py-1.5 text-[11px] text-peachStrong shadow-card">{current.tag}</span>
          </div>
          <div className={`grid h-28 w-28 shrink-0 place-items-center rounded-[24px] bg-gradient-to-br ${current.bg} shadow-card`}>
            <span className="text-5xl">{current.emoji}</span>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-3 text-[11px] text-textMuted">
          <span>约 {current.calories} kcal</span><span>·</span><span>约 {current.price} 元</span><span>·</span><span>{current.minutes} 分钟</span>
        </div>
        <div className="relative mt-4 grid grid-cols-[1.5fr_1fr] gap-2">
          <button onClick={recordRecommendation} className="btn-primary">就吃这个</button>
          <button
            onClick={() => { setRecommendIndex((i) => i + 1); setRefreshTick((tick) => tick + 1); }}
            className="btn-secondary flex items-center justify-center gap-1.5"
          >
            <Icon name="undo" size={16} />换一个
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-text">换种方式选</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(mode === item.id ? 'recommend' : item.id)}
              className={`card flex flex-col items-start gap-3 py-4 text-left active:scale-[0.98] ${mode === item.id ? 'ring-2 ring-primary' : ''}`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-2xl ${item.id === 'takeout' ? 'bg-greenSoft text-primary' : item.id === 'cook' ? 'bg-peachSoft text-peachStrong' : 'bg-cyanSoft text-cyanText'}`}>
                <Icon name={item.icon} size={19} />
              </span>
              <span className="text-sm font-semibold text-text">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {mode !== 'recommend' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="shrink-0 text-lg font-bold text-text">{mode === 'takeout' ? '外卖攻略' : mode === 'cook' ? '冰箱里有什么' : '附近好店'}</h2>
              {mode === 'nearby' && (
                <span className="chip shrink-0 bg-surface px-2.5 py-1 text-[10px] text-text/75">
                  <Icon name="pin" size={12} className="mr-1 inline text-primary" />武汉市·光谷
                </span>
              )}
            </div>
            <button onClick={() => setMode('recommend')} className="shrink-0 text-xs text-primary">看推荐</button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2.5 shadow-card">
            <Icon name="search" size={17} className="text-textMuted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜一搜想吃的" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none" />
            {query && <button onClick={() => setQuery('')} className="icon-btn h-7 w-7" aria-label="清空"><Icon name="close" size={14} /></button>}
          </div>

          {mode === 'takeout' && (
            <>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {['全部', ...Array.from(new Set(takeoutGuides.map((g) => g.category)))].map((category) => (
                  <button key={category} onClick={() => setTakeoutCategory(category)} className={`chip shrink-0 text-xs ${takeoutCategory === category ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{category}</button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="muted">共 {takeoutList.length} 条</p>
                <select value={takeoutSort} onChange={(e) => setTakeoutSort(e.target.value as SortMode)} className="rounded-full bg-surface px-3 py-1.5 text-[11px] text-text outline-none">
                  <option value="calorie">{sortLabel.calorie}</option>
                  <option value="frequent">{sortLabel.frequent}</option>
                </select>
              </div>
              {takeoutList.map((guide) => (
                <InfoCard
                  key={guide.id}
                  emoji={guide.emoji}
                  name={guide.brand}
                  calories={guide.calories}
                  iconClass="bg-surface"
                  recommendLabel="✅ 推荐"
                  recommendText={guide.orderTip}
                  avoidLabel="⚠️ 避坑"
                  avoidText={guide.avoid}
                />
              ))}
              {takeoutList.length === 0 && <p className="py-6 text-center text-xs text-textMuted">没找到相关攻略，换个词试试。</p>}
            </>
          )}

          {mode === 'cook' && (
            <>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((item) => (
                  <button key={item.id} onClick={() => setSelectedIngredients((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])} className={`chip text-xs ${selectedIngredients.includes(item.id) ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item.emoji} {item.name}</button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="muted">共 {recipeList.length} 道</p>
                <select value={cookSort} onChange={(e) => setCookSort(e.target.value as SortMode)} className="rounded-full bg-surface px-3 py-1.5 text-[11px] text-text outline-none">
                  <option value="calorie">{sortLabel.calorie}</option>
                  <option value="frequent">{sortLabel.frequent}</option>
                </select>
              </div>
              {recipeList.map((recipe) => (
                <InfoCard
                  key={recipe.id}
                  emoji={recipe.emoji}
                  name={recipe.name}
                  calories={recipe.calories}
                  iconClass="bg-greenSoft"
                  recommendLabel="🥗 食材"
                  recommendText={ingredientNames(recipe.ingredients)}
                  avoidLabel="💡 技巧"
                  avoidText={recipe.tip}
                />
              ))}
              {recipeList.length === 0 && <p className="py-6 text-center text-xs text-textMuted">选几样食材，或换个关键词。</p>}
            </>
          )}

          {mode === 'nearby' && (
            <>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {['全部', ...Array.from(new Set(nearbyMerchants.map((m) => m.category)))].map((category) => (
                  <button key={category} onClick={() => setNearbyCategory(category)} className={`chip shrink-0 text-xs ${nearbyCategory === category ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{category}</button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="muted">附近好选择 · 演示数据</p>
                <select value={nearbySort} onChange={(e) => setNearbySort(e.target.value as SortMode)} className="rounded-full bg-surface px-3 py-1.5 text-[11px] text-text outline-none">
                  <option value="calorie">{sortLabel.calorie}</option>
                  <option value="frequent">{sortLabel.frequent}</option>
                </select>
              </div>
              {nearbyList.map((shop) => (
                <InfoCard
                  key={shop.id}
                  emoji={shop.emoji}
                  name={shop.name}
                  calories={shop.avgCalories}
                  iconClass="bg-cyanSoft"
                  recommendLabel="✅ 推荐"
                  recommendText={shop.recommend}
                  avoidLabel="⚠️ 避坑"
                  avoidText={shop.avoid}
                />
              ))}
              {nearbyList.length === 0 && <p className="py-6 text-center text-xs text-textMuted">没找到相关店，换个词试试。</p>}
            </>
          )}
        </section>
      )}

      <div className="fixed bottom-[80px] left-1/2 z-20 w-[calc(100%-32px)] max-w-[340px] -translate-x-1/2">
        {floatDelta !== null && (
          <div key={floatDelta} className="pointer-events-none absolute -top-6 right-10 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primaryText shadow-card animate-float-up">
            +{floatDelta} kcal
          </div>
        )}
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-intake">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-textMuted">
              今日已摄入 <span className="font-bold text-text">{todayTotal}</span>
              <span className="px-0.5">/</span>
              <span className="font-bold text-text">{state.calorieGoal}</span>
              <span className="ml-0.5 text-[10px]">kcal</span>
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-greenSoft/60">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${intakePercent}%` }} />
              </span>
              <span className="shrink-0 text-[10px] text-textMuted">{mealSummary}</span>
            </div>
          </div>
          <Link to="/record" className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
            去记录 <Icon name="chevronRight" size={13} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
