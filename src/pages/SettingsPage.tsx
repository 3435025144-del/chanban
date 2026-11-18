import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { accessoryOptions, faceOptions, hairOptions, outfitOptions, skinOptions } from '../data/avatarOptions';
import type { AvatarConfig, Personality } from '../types';
import { todayKey } from '../utils/date';

const personalityLabel: Record<Personality, string> = {
  gentle: '温柔鼓励型',
  sassy: '毒舌闺蜜型',
  funny: '搞笑型',
};

function OptionRow<T extends { id: string; label: string }>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink/75">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`chip text-xs ${value === option.id ? 'bg-avocado text-white' : 'bg-cream text-ink/70'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(String(state.calorieGoal));
  const [height, setHeight] = useState(String(state.height));
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar.equipped);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGoal(String(state.calorieGoal));
    setHeight(String(state.height));
    setDraft(state.avatar.equipped);
  }, [state.calorieGoal, state.height, state.avatar.equipped]);

  const save = () => {
    const goalValue = Number(goal);
    const heightValue = Number(height);
    if (!goalValue || !heightValue) return;
    dispatch({ type: 'SET_GOAL', goal: goalValue });
    dispatch({ type: 'SET_HEIGHT', height: heightValue });
    dispatch({ type: 'UPDATE_AVATAR', patch: { ...draft, name: draft.name.trim() || '小馋' } });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/me" className="w-9 h-9 rounded-full bg-white grid place-items-center shadow-card">←</Link>
        <div>
          <p className="muted">按你舒服的方式调整</p>
          <h1 className="text-xl font-bold">偏好设置</h1>
        </div>
      </div>

      <section className="card space-y-4">
        <h2 className="section-title">身体参考数据</h2>
        <div className="space-y-2">
          <label className="text-xs text-ink/75">每日热量目标（kcal）</label>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="numeric" className="w-full bg-cream rounded-2xl px-4 py-3 text-sm outline-none" />
          <p className="muted">默认 1500，只是参考，不是考试线。</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-ink/75">身高（cm，用于计算 BMI）</label>
          <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" className="w-full bg-cream rounded-2xl px-4 py-3 text-sm outline-none" />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">分身信息</h2>
        <div className="space-y-2">
          <label className="text-xs text-ink/75">名字</label>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full bg-cream rounded-2xl px-4 py-3 text-sm outline-none" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink/75">性格</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(personalityLabel) as Personality[]).map((p) => (
              <button key={p} onClick={() => setDraft({ ...draft, personality: p })} className={`rounded-2xl py-2 text-[11px] ${draft.personality === p ? 'bg-avocado text-white' : 'bg-cream text-muted'}`}>
                {personalityLabel[p]}
              </button>
            ))}
          </div>
        </div>
        <OptionRow title="脸型" options={faceOptions} value={draft.face} onChange={(face) => setDraft({ ...draft, face })} />
        <OptionRow title="发型" options={hairOptions} value={draft.hair} onChange={(hair) => setDraft({ ...draft, hair })} />
        <OptionRow title="肤色" options={skinOptions} value={draft.skin} onChange={(skin) => setDraft({ ...draft, skin })} />
        <OptionRow title="服装" options={outfitOptions} value={draft.outfit} onChange={(outfit) => setDraft({ ...draft, outfit })} />
        <OptionRow title="配饰" options={accessoryOptions} value={draft.accessory} onChange={(accessory) => setDraft({ ...draft, accessory })} />
      </section>

      <button onClick={save} className="btn-primary w-full text-sm">{saved ? '已保存 ✓' : '保存设置'}</button>

      <button onClick={() => setConfirmOpen(true)} className="w-full rounded-full border border-coral/40 text-coralDark py-2.5 text-xs">
        清除本机数据
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="确认清除吗？">
        <div className="space-y-4 text-sm">
          <p>这会清空记录、星星、衣柜和分身设置，且无法恢复。确定要重新开始吗？</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmOpen(false)} className="btn-ghost text-xs">再想想</button>
            <button onClick={() => { dispatch({ type: 'CLEAR_DATA' }); dispatch({ type: 'OPEN_APP', date: todayKey() }); setConfirmOpen(false); navigate('/me'); }} className="bg-coral text-white rounded-full py-2.5 text-xs">
              确认清除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
