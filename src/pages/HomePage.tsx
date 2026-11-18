import { useMemo, useState } from 'react';
import Avatar, { equippedLabel } from '../components/Avatar';
import Modal from '../components/Modal';
import { getAvatarLine, greetingLines } from '../data/avatarLines';
import { fortunes } from '../data/fortune';
import { ingredients } from '../data/ingredients';
import { matchRecipes } from '../data/recipes';
import { nearbyMerchants, takeoutGuides } from '../data/takeoutGuides';
import { durationLabels, goalLabels } from '../data/workouts';
import { useApp } from '../context/AppContext';
import type { WorkoutDuration, WorkoutGoal } from '../types';
import { formatDateCN, todayKey } from '../utils/date';

type Mode = 'takeout' | 'cook' | 'nearby';

const modeTabs: { id: Mode; label: string; emoji: string }[] = [
  { id: 'takeout', label: '今天吃外卖', emoji: '🛵' },
  { id: 'cook', label: '自己做', emoji: '🍳' },
  { id: 'nearby', label: '推荐商家', emoji: '📍' },
];

export default function HomePage() {
  const { state, dispatch, todayWorkout, workoutLowBarrier, workoutLine, lowBarrierLine } = useApp();
  const [mode, setMode] = useState<Mode>('takeout');
  const [coachGoal, setCoachGoal] = useState<WorkoutGoal>(state.coach.goal);
  const [coachDuration, setCoachDuration] = useState<WorkoutDuration>(state.coach.duration);
  const [selected, setSelected] = useState<string[]>([]);
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [fortuneIndex, setFortuneIndex] = useState(() => Math.floor(Math.random() * fortunes.length));
  const [greetingSeed, setGreetingSeed] = useState(() => Math.floor(Math.random() * greetingLines.length));

  const date = todayKey();
  const todayStatus = state.coach.dailyStatus[date];
  const greeting = greetingLines[greetingSeed % greetingLines.length];
  const dailyLine = useMemo(
    () => getAvatarLine(state.avatar.equipped.personality),
    [greetingSeed, state.avatar.equipped.personality],
  );
  const recommended = useMemo(() => matchRecipes(selected), [selected]);
  const fortune = fortunes[fortuneIndex];

  const toggleIngredient = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setOpenRecipe(null);
  };

  return (
    <div className="pb-6">
      <header className="bg-gradient-to-b from-peach to-cream px-5 pt-6 pb-5 rounded-b-[32px]">
        <div className="flex items-center justify-between text-xs text-ink/60">
          <span>{formatDateCN(date)}</span>
          <span className="bg-white/70 rounded-full px-2.5 py-1">今日运势在路上 ✨</span>
        </div>
        <div className="flex flex-col items-center mt-3">
          <button onClick={() => setGreetingSeed((s) => s + 1)} className="animate-float" aria-label="换个问候">
            <Avatar config={state.avatar.equipped} size={168} />
          </button>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-lg font-bold">{state.avatar.equipped.name}</h1>
            <span className="text-[11px] bg-white text-coralDark px-2 py-0.5 rounded-full border border-coral/20">
              {state.avatar.mood}
            </span>
          </div>
          <p className="mt-2 text-sm text-ink/75 text-center max-w-[280px] leading-relaxed">“{greeting}”</p>
          <p className="mt-1 text-[11px] text-muted">今日穿搭：{equippedLabel(state.avatar.equipped)}</p>
        </div>
      </header>

      <main className="px-4 mt-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 bg-white/70 p-1.5 rounded-2xl border border-line">
          {modeTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`rounded-xl py-2 text-xs font-medium transition-all ${
                mode === tab.id ? 'bg-coral text-white shadow-pop' : 'text-ink/70'
              }`}
            >
              <span className="block text-base mb-0.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'takeout' && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">连锁店低卡点单攻略</h2>
              <span className="muted">共 {takeoutGuides.length} 条</span>
            </div>
            {takeoutGuides.map((guide) => (
              <article key={guide.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{guide.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{guide.brand}</h3>
                      <span className="text-[10px] bg-mintSoft text-mint px-1.5 py-0.5 rounded">{guide.tag}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-coralDark">约 {guide.calories} kcal</span>
                </div>
                <p className="text-[13px] leading-relaxed text-ink/80">✅ {guide.orderTip}</p>
                <p className="text-xs text-muted">⚠️ 避坑：{guide.avoid}</p>
              </article>
            ))}
          </section>
        )}

        {mode === 'cook' && (
          <section className="space-y-3">
            <div>
              <h2 className="section-title">今天冰箱里有什么？</h2>
              <p className="muted mt-0.5">选几个食材，我给你配几道轻盈好菜（可多选）</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((item) => {
                const active = selected.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleIngredient(item.id)}
                    className={`chip ${active ? 'bg-coral text-white border-coral' : 'bg-white border-line text-ink/75'}`}
                  >
                    {item.emoji} {item.name}
                  </button>
                );
              })}
            </div>
            {selected.length === 0 ? (
              <div className="card text-center text-sm text-muted py-8">先点几个食材吧，灵感马上就来 🥬</div>
            ) : recommended.length === 0 ? (
              <div className="card text-center text-sm text-muted py-8">这几个搭在一起有点难，试试再加一样？</div>
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
                      <button
                        onClick={() => setOpenRecipe(openRecipe === recipe.id ? null : recipe.id)}
                        className="text-xs text-coralDark bg-peach rounded-full px-2.5 py-1"
                      >
                        {openRecipe === recipe.id ? '收起' : '看做法'}
                      </button>
                    </div>
                    <p className="text-xs text-ink/70 bg-mintSoft rounded-xl p-2">💡 低脂技巧：{recipe.tip}</p>
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
            <div>
              <h2 className="section-title">附近低卡友好商家</h2>
              <p className="muted mt-0.5">演示数据 · 主打一个吃得开心</p>
            </div>
            {nearbyMerchants.map((shop) => (
              <article key={shop.id} className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-peach grid place-items-center text-xl">{shop.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{shop.name}</h3>
                    <span className="text-[10px] text-muted shrink-0">{shop.distance}</span>
                  </div>
                  <p className="text-xs text-ink/70 truncate">{shop.type} · 推荐：{shop.dish}</p>
                  <p className="text-[11px] text-coralDark mt-0.5">人均约 {shop.avgCalories} kcal</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {state.coach.onboarded && todayWorkout && (
          <section className="card space-y-3 border-coral/20">
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 rounded-2xl bg-peach grid place-items-center text-3xl shrink-0">
                {todayWorkout.cover}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="section-title">今日教练</h2>
                  <span className="text-[10px] bg-mintSoft text-mint px-2 py-0.5 rounded-full shrink-0">
                    {durationLabels[todayWorkout.duration]}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1">你的教练今天安排了：{todayWorkout.name}</p>
                <p className="muted mt-0.5">
                  {goalLabels[todayWorkout.goal]} · {todayWorkout.equipment} · {todayWorkout.description}
                </p>
              </div>
            </div>

            {workoutLowBarrier && (
              <p className="text-xs text-ink/75 bg-mintSoft rounded-xl p-2.5 leading-relaxed">
                🌱 {lowBarrierLine}今天为你换成了 5 分钟轻量方案。
              </p>
            )}

            <p className="text-xs text-ink/75 italic">“{workoutLine}” —— {state.avatar.equipped.name}</p>

            <details className="text-xs text-ink/70 bg-cream rounded-xl p-3">
              <summary className="cursor-pointer text-coralDark">看看动作怎么做</summary>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                {todayWorkout.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </details>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => dispatch({ type: 'WORKOUT_COMPLETE', date })}
                disabled={todayStatus === 'completed'}
                className="btn-primary text-xs disabled:opacity-50"
              >
                完成训练 · +2⭐
              </button>
              <button
                onClick={() => dispatch({ type: 'WORKOUT_SKIP', date })}
                disabled={todayStatus === 'skipped'}
                className="btn-ghost text-xs disabled:opacity-50"
              >
                今天不想练
              </button>
            </div>
            {todayStatus === 'completed' && <p className="text-[11px] text-mint text-center">今天已经完成啦，分身给你鼓掌 👏</p>}
            {todayStatus === 'skipped' && <p className="text-[11px] text-muted text-center">记下啦，没关系，明天我们再见。</p>}
          </section>
        )}

        <section className="card bg-gradient-to-br from-[#FFF3E8] to-[#FFE7DC] border-0">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{fortune.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="section-title">今日运势</h2>
                <button onClick={() => setFortuneIndex((i) => (i + 1) % fortunes.length)} className="text-xs text-coralDark">
                  换一条 ↻
                </button>
              </div>
              <p className="text-sm mt-1.5 font-medium">{fortune.fortune}</p>
              <p className="text-xs text-ink/70 mt-1">{fortune.food}</p>
              <p className="text-[10px] text-muted mt-3 text-right">仅供娱乐参考</p>
            </div>
          </div>
        </section>

        <p className="text-center text-[11px] text-muted pb-2">“{dailyLine}” —— {state.avatar.equipped.name}</p>
      </main>

      <Modal open={!state.coach.onboarded} onClose={() => {}} title="认识一下你的教练">
        <div className="space-y-5">
          <p className="text-sm text-ink/75">只想问两个小问题，答完就有今天的安排啦。</p>
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink/75">1. 你现在更想往哪个方向走？</p>
            <div className="grid grid-cols-3 gap-2">
              {(['fatLoss', 'toning', 'maintain'] as WorkoutGoal[]).map((goal) => (
                <button
                  key={goal}
                  onClick={() => setCoachGoal(goal)}
                  className={`rounded-xl py-2.5 text-xs border ${coachGoal === goal ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
                >
                  {goalLabels[goal]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink/75">2. 每天大概能练多久？</p>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 20] as WorkoutDuration[]).map((duration) => (
                <button
                  key={duration}
                  onClick={() => setCoachDuration(duration)}
                  className={`rounded-xl py-2.5 text-xs border ${coachDuration === duration ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
                >
                  {durationLabels[duration]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_COACH_CONFIG', goal: coachGoal, duration: coachDuration, date })}
            className="btn-primary w-full text-sm"
          >
            好啦，给我安排今天的训练
          </button>
          <p className="text-[10px] text-muted text-center">随时可以在「我的」里调整，也可以选择不练。</p>
        </div>
      </Modal>
    </div>
  );
}
