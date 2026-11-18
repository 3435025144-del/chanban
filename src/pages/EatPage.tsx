import { useMemo, useState } from 'react';
import { fortunes } from '../data/fortune';
import { ingredients } from '../data/ingredients';
import { matchRecipes } from '../data/recipes';
import { nearbyMerchants, takeoutGuides } from '../data/takeoutGuides';

type Mode = 'takeout' | 'cook' | 'nearby';
type SortMode = 'calorie' | 'frequent';

const modeTabs: { id: Mode; label: string; emoji: string }[] = [
  { id: 'takeout', label: '吃外卖', emoji: '🛵' },
  { id: 'cook', label: '自己做', emoji: '🍳' },
  { id: 'nearby', label: '商家', emoji: '📍' },
];

const sortLabel: Record<SortMode, string> = {
  calorie: '按卡路里从低到高',
  frequent: '按经常吃/去优先',
};

export default function EatPage() {
  const [mode, setMode] = useState<Mode>('takeout');
  const [fortuneIndex, setFortuneIndex] = useState(() => Math.floor(Math.random() * fortunes.length));
  const [selected, setSelected] = useState<string[]>([]);
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [takeoutCategory, setTakeoutCategory] = useState('全部');
  const [nearbyCategory, setNearbyCategory] = useState('全部');
  const [takeoutSort, setTakeoutSort] = useState<SortMode>('calorie');
  const [nearbySort, setNearbySort] = useState<SortMode>('calorie');

  const takeoutCategories = ['全部', ...Array.from(new Set(takeoutGuides.map((g) => g.category)))];
  const nearbyCategories = ['全部', ...Array.from(new Set(nearbyMerchants.map((m) => m.category)))];

  const takeoutList = useMemo(() => {
    return takeoutGuides
      .filter((g) => takeoutCategory === '全部' || g.category === takeoutCategory)
      .slice()
      .sort((a, b) => (takeoutSort === 'calorie' ? a.calories - b.calories : b.frequency - a.frequency));
  }, [takeoutCategory, takeoutSort]);

  const nearbyList = useMemo(() => {
    return nearbyMerchants
      .filter((m) => nearbyCategory === '全部' || m.category === nearbyCategory)
      .slice()
      .sort((a, b) => (nearbySort === 'calorie' ? a.avgCalories - b.avgCalories : b.frequency - a.frequency));
  }, [nearbyCategory, nearbySort]);

  const recommended = useMemo(() => matchRecipes(selected), [selected]);
  const fortune = fortunes[fortuneIndex];

  const toggleIngredient = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setOpenRecipe(null);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div>
        <p className="muted">今天想吃点什么？</p>
        <h1 className="text-2xl font-bold mt-1">好好吃，也好好开心</h1>
      </div>

      <section className="rounded-3xl bg-coral text-white p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{fortune.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">今日运势</h2>
              <button onClick={() => setFortuneIndex((i) => (i + 1) % fortunes.length)} className="text-xs text-white/80">
                换一条 ↻
              </button>
            </div>
            <p className="text-sm mt-1 font-medium">{fortune.fortune}</p>
            <p className="text-xs mt-1 text-white/85">{fortune.food}</p>
            <p className="text-[10px] text-white/60 mt-2 text-right">仅供娱乐参考</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 bg-white/70 p-1.5 rounded-3xl">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`rounded-2xl py-2 text-xs font-medium transition-colors ${
              mode === tab.id ? 'bg-avocado text-white shadow-card' : 'text-ink/70'
            }`}
          >
            <span className="block text-base mb-0.5">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'takeout' && (
        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {takeoutCategories.map((category) => (
              <button
                key={category}
                onClick={() => setTakeoutCategory(category)}
                className={`chip shrink-0 text-xs ${takeoutCategory === category ? 'bg-avocado text-white' : 'bg-white text-muted'}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="muted">共 {takeoutList.length} 条攻略</p>
            <select
              value={takeoutSort}
              onChange={(e) => setTakeoutSort(e.target.value as SortMode)}
              className="bg-white rounded-full px-3 py-1.5 text-[11px] text-avocadoDark outline-none"
            >
              <option value="calorie">{sortLabel.calorie}</option>
              <option value="frequent">{sortLabel.frequent}</option>
            </select>
          </div>
          {takeoutList.map((guide) => (
            <article key={guide.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{guide.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{guide.brand}</h3>
                    <span className="text-[10px] bg-avocadoSoft text-avocadoDark px-2 py-0.5 rounded-full">{guide.category} · 常点 {guide.frequency} 次</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-avocadoDark">{guide.calories} kcal</span>
              </div>
              <p className="text-[13px] text-ink/80">✅ {guide.orderTip}</p>
              <p className="text-xs text-muted">⚠️ {guide.avoid}</p>
            </article>
          ))}
        </section>
      )}

      {mode === 'cook' && (
        <section className="space-y-3">
          <div>
            <h2 className="section-title">冰箱里有什么？</h2>
            <p className="muted mt-1">多选食材，我给你配几道舒服的低脂菜。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleIngredient(item.id)}
                  className={`chip text-xs ${active ? 'bg-avocado text-white' : 'bg-white text-ink/70'}`}
                >
                  {item.emoji} {item.name}
                </button>
              );
            })}
          </div>
          {selected.length === 0 ? (
            <div className="card text-center text-sm text-muted py-8">先点几个食材吧，灵感马上来 🥬</div>
          ) : recommended.length === 0 ? (
            <div className="card text-center text-sm text-muted py-8">这几样搭在一起有点难，再加一样试试？</div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">为你配到 {recommended.length} 道菜</h3>
              {recommended.map((recipe) => (
                <article key={recipe.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2">
                      <span className="text-2xl">{recipe.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{recipe.name}</h4>
                        <p className="muted">{recipe.tag} · 约 {recipe.calories} kcal</p>
                      </div>
                    </div>
                    <button onClick={() => setOpenRecipe(openRecipe === recipe.id ? null : recipe.id)} className="text-xs text-avocadoDark bg-avocadoSoft rounded-full px-3 py-1">
                      {openRecipe === recipe.id ? '收起' : '看做法'}
                    </button>
                  </div>
                  <p className="text-xs text-ink/70 bg-mintSoft rounded-2xl p-2">💡 {recipe.tip}</p>
                  {openRecipe === recipe.id && (
                    <ol className="list-decimal list-inside text-xs text-ink/75 space-y-1">
                      {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {mode === 'nearby' && (
        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {nearbyCategories.map((category) => (
              <button
                key={category}
                onClick={() => setNearbyCategory(category)}
                className={`chip shrink-0 text-xs ${nearbyCategory === category ? 'bg-avocado text-white' : 'bg-white text-muted'}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="muted">演示数据 · 附近好选择</p>
            <select
              value={nearbySort}
              onChange={(e) => setNearbySort(e.target.value as SortMode)}
              className="bg-white rounded-full px-3 py-1.5 text-[11px] text-avocadoDark outline-none"
            >
              <option value="calorie">{sortLabel.calorie}</option>
              <option value="frequent">{sortLabel.frequent}</option>
            </select>
          </div>
          {nearbyList.map((shop) => (
            <article key={shop.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-avocadoSoft grid place-items-center text-xl">{shop.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate">{shop.name}</h3>
                  <span className="text-[10px] text-muted shrink-0">{shop.distance}</span>
                </div>
                <p className="text-xs text-ink/70 truncate">{shop.category} · {shop.dish}</p>
                <p className="text-[11px] text-avocadoDark mt-0.5">人均 {shop.avgCalories} kcal · 常去 {shop.frequency} 次</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
