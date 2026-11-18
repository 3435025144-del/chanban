import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { durationLabels, goalLabels } from '../data/workouts';
import type { Personality, WorkoutDuration, WorkoutGoal } from '../types';
import { todayKey } from '../utils/date';

const personalityLabel: Record<Personality, string> = {
  gentle: '温柔鼓励型',
  sassy: '毒舌闺蜜型',
  funny: '搞笑型',
};

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const [goal, setGoal] = useState(String(state.calorieGoal));
  const [name, setName] = useState(state.avatar.equipped.name);
  const [personality, setPersonality] = useState<Personality>(state.avatar.equipped.personality);
  const [coachGoal, setCoachGoal] = useState<WorkoutGoal>(state.coach.goal);
  const [coachDuration, setCoachDuration] = useState<WorkoutDuration>(state.coach.duration);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGoal(String(state.calorieGoal));
    setName(state.avatar.equipped.name);
    setPersonality(state.avatar.equipped.personality);
    setCoachGoal(state.coach.goal);
    setCoachDuration(state.coach.duration);
  }, [state.calorieGoal, state.avatar.equipped.name, state.avatar.equipped.personality, state.coach.goal, state.coach.duration]);

  const save = () => {
    const value = Number(goal);
    if (!value || value < 800) return;
    dispatch({ type: 'SET_GOAL', goal: value });
    dispatch({ type: 'UPDATE_AVATAR', patch: { name: name.trim() || '小馋', personality } });
    dispatch({ type: 'SET_COACH_CONFIG', goal: coachGoal, duration: coachDuration, date: todayKey() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const stats = [
    { label: '连续记录', value: `${state.streakDays} 天` },
    { label: '扛馋成功', value: `${state.totalCravingsResisted} 次` },
    { label: '当前等级', value: `Lv.${state.avatar.level}` },
    { label: '星星余额', value: `⭐ ${state.blindBox.stars}` },
    { label: '碎片数量', value: `🧩 ${state.blindBox.fragments}` },
    { label: '累计记录', value: `${state.totalMealsLogged} 餐` },
  ];

  return (
    <div className="px-4 pt-6 pb-6 space-y-4">
      <h1 className="text-xl font-bold">我的</h1>
      <p className="muted -mt-3">所有设置都只为你舒服，不为难自己。</p>

      <section className="card space-y-3">
        <h2 className="section-title">偏好设置</h2>
        <div className="space-y-1">
          <label className="text-xs text-ink/75">每日热量目标（kcal）</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            inputMode="numeric"
            className="w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
          />
          <p className="muted">默认 1500，只是一个参考数字，不是考试线。</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink/75">分身名字</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-ink/75">分身性格</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(personalityLabel) as Personality[]).map((p) => (
              <button
                key={p}
                onClick={() => setPersonality(p)}
                className={`rounded-xl py-2 text-[11px] border ${personality === p ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
              >
                {personalityLabel[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-line pt-3">
          <p className="text-xs font-medium text-ink/75">今日教练设置</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['fatLoss', 'toning', 'maintain'] as WorkoutGoal[]).map((g) => (
              <button
                key={g}
                onClick={() => setCoachGoal(g)}
                className={`rounded-xl py-2 text-[11px] border ${coachGoal === g ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
              >
                {goalLabels[g]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {([5, 10, 20] as WorkoutDuration[]).map((d) => (
              <button
                key={d}
                onClick={() => setCoachDuration(d)}
                className={`rounded-xl py-2 text-[11px] border ${coachDuration === d ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
              >
                {durationLabels[d]}
              </button>
            ))}
          </div>
          <p className="muted">改完保存，明天的安排会按新目标来。</p>
        </div>
        <button onClick={save} className="btn-primary w-full text-sm">{saved ? '已保存 ✓' : '保存修改'}</button>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">数据概览</h2>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-cream rounded-xl p-3">
              <p className="text-[11px] text-muted">{s.label}</p>
              <p className="text-base font-semibold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <p className="muted">数据保存在这台设备上，刷新也不会丢。</p>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">关于馋伴</h2>
        <p className="text-xs text-ink/70 leading-relaxed">
          馋伴相信：减肥不该是一场审判。吃放纵餐也能被喜欢，如实记录本身就是值得庆祝的事。
          这里的奖励只增不减，分身永远不会因为你而受苦。
        </p>
        <button onClick={() => setConfirmOpen(true)} className="w-full border border-coral/30 text-coralDark rounded-full py-2.5 text-xs">
          清除本机数据
        </button>
      </section>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="确认清除吗？">
        <div className="space-y-4 text-sm">
          <p>这会清空记录、星星、衣柜和分身设置，且无法恢复。确定要重新开始吗？</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmOpen(false)} className="btn-ghost text-xs">再想想</button>
            <button
              onClick={() => {
                dispatch({ type: 'CLEAR_DATA' });
                dispatch({ type: 'OPEN_APP', date: todayKey() });
                setConfirmOpen(false);
              }}
              className="bg-coralDark text-white rounded-full py-2.5 text-xs"
            >
              确认清除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
