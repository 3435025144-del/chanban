import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon, { type IconName } from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { fortunes } from '../data/fortune';
import { ingredients } from '../data/ingredients';
import { matchRecipes, recipes as allRecipes } from '../data/recipes';
import { nearbyMerchants, takeoutGuides } from '../data/takeoutGuides';
import type { MealType } from '../types';
import { currentTime, getMealByTime, mealLabels, mealOrder } from '../utils/meal';
import { todayKey } from '../utils/date';

type Mode = 'takeout' | 'cook' | 'nearby';
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

const modeTabs: { id: Mode; label: string; icon: IconName }[] = [
  { id: 'takeout', label: '外卖攻略', icon: 'eat' },
  { id: 'cook', label: '自己做', icon: 'sparkle' },
  { id: 'nearby', label: '附近好店', icon: 'search' },
];

const sortLabel: Record<SortMode, string> = {
  calorie: '按热量从低到高',
  frequent: '按常吃优先',
};

const mealChoices = mealOrder.filter((meal) => meal !== 'unknown');

export default function EatPage() {
  const { dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('takeout');
  const [fortuneIndex, setFortuneIndex] = useState(() => Math.floor(Math.random() * fortunes.length));
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [takeoutCategory, setTakeoutCategory] = useState('全部');
  const [nearbyCategory, setNearbyCategory] = useState('全部');
  const [takeoutSort, setTakeoutSort] = useState<SortMode>('calorie');
  const [nearbySort, setNearbySort] = useState<SortMode>('calorie');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Candidate | null>(null);
  const [step, setStep] = useState<Step>('detail');
  const [amount, setAmount] = useState('1');
  const [meal, setMeal] = useState<MealType>(() => getMealByTime());

  const fortune = fortunes[fortuneIndex];
  const keyword = query.trim().toLowerCase();
  const matches = (...values: (string | number | undefined)[]) =>
    !keyword || values.some((value) => String(value ?? '').toLowerCase().includes(keyword));
  const takeoutCategories = ['全部', ...Array.from(new Set(takeoutGuides.map((g) => g.category)))];
  const nearbyCategories = ['全部', ...Array.from(new Set(nearbyMerchants.map((m) => m.category)))];

  const takeoutList = useMemo(
    () =>
      takeoutGuides
        .filter((g) => takeoutCategory === '全部' || g.category === takeoutCategory)
        .filter((g) => matches(g.brand, g.category, g.orderTip, g.avoid, g.emoji))
        .slice()
        .sort((a, b) => (takeoutSort === 'calorie' ? a.calories - b.calories : b.frequency - a.frequency)),
    [takeoutCategory, takeoutSort, keyword],
  );

  const nearbyList = useMemo(
    () =>
      nearbyMerchants
        .filter((m) => nearbyCategory === '全部' || m.category === nearbyCategory)
        .filter((m) => matches(m.name, m.type, m.dish, m.category, m.emoji))
        .slice()
        .sort((a, b) => (nearbySort === 'calorie' ? a.avgCalories - b.avgCalories : b.frequency - a.frequency)),
    [nearbyCategory, nearbySort, keyword],
  );

  const recommended = useMemo(() => matchRecipes(selectedIngredients), [selectedIngredients]);
  const visibleIngredients = ingredients.filter((item) => matches(item.name, item.category));
  const recipes = useMemo(() => {
    if (!keyword) return recommended;
    return allRecipes.filter((recipe) =>
      matches(
        recipe.name,
        recipe.tag,
        recipe.tip,
        ...recipe.ingredients.map((id) => ingredients.find((item) => item.id === id)?.name ?? id),
      ),
    );
  }, [recommended, keyword]);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    <div className="space-y-4 px-4 pb-8 pt-6">
      <header>
        <p className="muted">今天想吃点什么？</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">好好吃，也好好开心</h1>
      </header>

      <section className="flex items-center gap-3 rounded-[20px] bg-coralSoft p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white text-coralInk">
          <Icon name="sparkle" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{fortune.fortune}</p>
          <p className="mt-0.5 truncate text-xs text-coralInk">{fortune.food}</p>
        </div>
        <button
          onClick={() => setFortuneIndex((i) => (i + 1) % fortunes.length)}
          className="icon-btn h-8 w-8 shrink-0"
          aria-label="换一条运势"
        >
          <Icon name="undo" size={17} />
        </button>
      </section>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-warm p-1">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs transition-all duration-150 active:scale-95 ${
              mode === tab.id ? 'bg-white font-semibold text-avocadoInk shadow-card' : 'text-muted'
            }`}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-card">
        <Icon name="search" size={18} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'takeout' ? '搜品牌、菜品或攻略' : mode === 'cook' ? '搜菜名或食材' : '搜店名、菜品或类型'}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          aria-label="搜索吃什么"
        />
        {query && (
          <button onClick={() => setQuery('')} className="icon-btn h-7 w-7 shrink-0" aria-label="清空搜索">
            <Icon name="close" size={15} />
          </button>
        )}
      </div>

      {mode === 'takeout' && (
        <section className="space-y-3">
          <div className="no-scrollbar scroll-fade flex gap-2 overflow-x-auto pb-1">
            {takeoutCategories.map((category) => (
              <button
                key={category}
                onClick={() => setTakeoutCategory(category)}
                className={`chip shrink-0 text-xs ${takeoutCategory === category ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="muted">共 {takeoutList.length} 条攻略</p>
            <label className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] text-avocadoInk shadow-card">
              <Icon name="filter" size={13} />
              <select value={takeoutSort} onChange={(e) => setTakeoutSort(e.target.value as SortMode)} className="bg-transparent outline-none">
                <option value="calorie">{sortLabel.calorie}</option>
                <option value="frequent">{sortLabel.frequent}</option>
              </select>
            </label>
          </div>
          {takeoutList.map((guide) => (
            <button
              key={guide.id}
              onClick={() =>
                openDetail({
                  id: guide.id,
                  name: guide.brand,
                  emoji: guide.emoji,
                  calories: guide.calories,
                  category: guide.category,
                  detail: guide.orderTip,
                  avoid: guide.avoid,
                  kind: `外卖攻略 · ${guide.brand}`,
                  frequency: guide.frequency,
                })
              }
              className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warm text-lg">{guide.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{guide.brand}</span>
                  <span className="shrink-0 text-sm font-bold text-avocadoInk">{guide.calories} kcal</span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted">{guide.category} · 常点 {guide.frequency} 次</span>
              </span>
              <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
            </button>
          ))}
          {takeoutList.length === 0 && <div className="card py-8 text-center text-sm text-muted">没找到相关攻略，换个词试试。</div>}
        </section>
      )}

      {mode === 'cook' && (
        <section className="space-y-3">
          <div>
            <h2 className="section-title">冰箱里有什么？</h2>
            <p className="muted mt-1">选几样食材，我给你配舒服的家常菜。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleIngredients.map((item) => {
              const activeIngredient = selectedIngredients.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleIngredient(item.id)}
                  className={`chip text-xs active:scale-95 ${activeIngredient ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}
                >
                  {item.emoji} {item.name}
                </button>
              );
            })}
            {visibleIngredients.length === 0 && <p className="muted">没有匹配的食材，试试别的词。</p>}
          </div>
          {keyword && recipes.length === 0 ? (
            <div className="card py-8 text-center text-sm text-muted">没找到这道菜，换个词试试。</div>
          ) : !keyword && selectedIngredients.length === 0 ? (
            <div className="card py-8 text-center text-sm text-muted">先点几样食材，灵感马上来。</div>
          ) : recipes.length === 0 ? (
            <div className="card py-8 text-center text-sm text-muted">这几样搭在一起有点难，再加一样试试？</div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{keyword ? `搜到 ${recipes.length} 道菜` : `为你配到 ${recipes.length} 道菜`}</h3>
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() =>
                    openDetail({
                      id: recipe.id,
                      name: recipe.name,
                      emoji: recipe.emoji,
                      calories: recipe.calories,
                      category: recipe.tag,
                      detail: `用 ${recipe.ingredients.map((id) => ingredients.find((i) => i.id === id)?.name ?? id).join('、')} 就能做。`,
                      tip: recipe.tip,
                      steps: recipe.steps,
                      kind: '自己做',
                      frequency: 0,
                    })
                  }
                  className="card w-full space-y-2 text-left active:scale-[0.99]"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-warm text-lg">{recipe.emoji}</span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">{recipe.name}</span>
                        <span className="muted">{recipe.tag} · 约 {recipe.calories} kcal</span>
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="mt-3 shrink-0 text-muted" />
                  </span>
                  <span className="block rounded-2xl bg-warm p-2 text-xs leading-relaxed text-ink/75">{recipe.tip}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {mode === 'nearby' && (
        <section className="space-y-3">
          <div className="no-scrollbar scroll-fade flex gap-2 overflow-x-auto pb-1">
            {nearbyCategories.map((category) => (
              <button
                key={category}
                onClick={() => setNearbyCategory(category)}
                className={`chip shrink-0 text-xs ${nearbyCategory === category ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="muted">附近好选择 · 演示数据</p>
            <label className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] text-avocadoInk shadow-card">
              <Icon name="filter" size={13} />
              <select value={nearbySort} onChange={(e) => setNearbySort(e.target.value as SortMode)} className="bg-transparent outline-none">
                <option value="calorie">{sortLabel.calorie}</option>
                <option value="frequent">{sortLabel.frequent}</option>
              </select>
            </label>
          </div>
          {nearbyList.map((shop) => (
            <button
              key={shop.id}
              onClick={() =>
                openDetail({
                  id: shop.id,
                  name: shop.name,
                  emoji: shop.emoji,
                  calories: shop.avgCalories,
                  category: shop.category,
                  detail: `${shop.type} · ${shop.dish}`,
                  kind: `附近好店 · ${shop.name}`,
                  frequency: shop.frequency,
                })
              }
              className="card flex w-full items-center gap-3 text-left active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warm text-lg">{shop.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{shop.name}</span>
                  <span className="shrink-0 text-[10px] text-muted">{shop.distance}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted">{shop.dish}</span>
                <span className="mt-0.5 block text-[11px] text-avocadoInk">人均约 {shop.avgCalories} kcal</span>
              </span>
              <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
            </button>
          ))}
          {nearbyList.length === 0 && <div className="card py-8 text-center text-sm text-muted">没找到相关店，换个词试试。</div>}
        </section>
      )}

      <Modal open={!!active} onClose={closeModal} title={active ? (step === 'result' ? '记下啦' : step === 'confirm' ? '确认这一餐' : active.name) : ''}>
        {active && step === 'detail' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-warm p-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl">{active.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{active.name}</p>
                <p className="muted">{active.category} · 约 {active.calories} kcal</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink/80">{active.detail}</p>
            {active.tip && <div className="rounded-2xl bg-coralSoft p-3 text-xs leading-relaxed text-coralInk">{active.tip}</div>}
            {active.avoid && <p className="muted leading-relaxed">{active.avoid}</p>}
            {active.steps && (
              <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-ink/75">
                {active.steps.map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            )}
            <button onClick={() => setStep('confirm')} className="btn-primary w-full">就选它</button>
          </div>
        )}
        {active && step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-warm px-3 py-2.5">
              <span className="text-sm font-medium text-ink">{active.name}</span>
              <span className="text-sm font-bold text-avocadoInk">{totalCalories} kcal</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink/75">吃了多少？</p>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-avocado/30"
                placeholder="例如 1"
              />
              <p className="muted">填份数就可以，热量会跟着算好。</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink/75">放进哪一餐？</p>
              <div className="flex flex-wrap gap-2">
                {mealChoices.map((item) => (
                  <button
                    key={item}
                    onClick={() => setMeal(item)}
                    className={`chip text-xs ${meal === item ? 'bg-avocado text-avocadoInk' : 'bg-warm text-muted'}`}
                  >
                    {mealLabels[item]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep('detail')} className="btn-secondary">再看看</button>
              <button onClick={confirmRecord} className="btn-primary">确认记录</button>
            </div>
          </div>
        )}
        {active && step === 'result' && (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-avocadoSoft text-avocadoInk">
              <Icon name="check" size={28} />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">{active.name} 已经记好啦</p>
              <p className="muted mt-1">分身收到一颗星，等你去星星盒拆礼物。</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { closeModal(); navigate('/avatar'); }} className="btn-primary">去看分身</button>
              <button onClick={closeModal} className="btn-secondary">继续看看</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
