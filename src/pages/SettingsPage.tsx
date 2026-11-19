import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import {
  accessoryOptions, actionOptions, backgroundOptions, bottomOptions, faceOptions,
  hairOptions, outfitOptions, shoesOptions, skinOptions,
} from '../data/avatarOptions';
import type { AvatarConfig, Personality, TasteProfile } from '../types';
import { todayKey } from '../utils/date';

const personalityLabel: Record<Personality, string> = { gentle: '温柔鼓励', sassy: '俏皮吐槽', funny: '搞笑陪伴' };

function OptionRow<T extends { id: string; label: string }>({ title, options, value, onChange }: { title: string; options: T[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text/75">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button key={option.id} onClick={() => onChange(option.id)} className={`chip text-xs ${value === option.id ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{option.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(String(state.calorieGoal));
  const [height, setHeight] = useState(String(state.height));
  const [waterGoal, setWaterGoal] = useState(String(state.waterGoal));
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar.equipped);
  const [taste, setTaste] = useState<TasteProfile>(state.tasteProfile);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setGoal(String(state.calorieGoal)); setHeight(String(state.height)); setWaterGoal(String(state.waterGoal));
    setDraft(state.avatar.equipped); setTaste(state.tasteProfile);
  }, [state.calorieGoal, state.height, state.waterGoal, state.avatar.equipped, state.tasteProfile]);

  const save = () => {
    const goalValue = Number(goal); const heightValue = Number(height); const waterValue = Number(waterGoal);
    if (!goalValue || !heightValue || !waterValue) { notify('几个数字都填一下就可以啦'); return; }
    dispatch({ type: 'SET_GOAL', goal: goalValue });
    dispatch({ type: 'SET_HEIGHT', height: heightValue });
    dispatch({ type: 'SET_WATER_GOAL', goal: waterValue });
    dispatch({ type: 'SET_TASTE_PROFILE', patch: taste });
    dispatch({ type: 'UPDATE_AVATAR', patch: { ...draft, name: draft.name.trim() || '小馋' } });
    notify('设置已经保存好啦');
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <SubPageHeader title="设置" subtitle="按你舒服的方式调整" backTo="/me" />

      <section className="card space-y-4">
        <h2 className="section-title">吃饭偏好</h2>
        <div className="space-y-2"><p className="text-xs text-text/75">口味</p><div className="flex flex-wrap gap-2">{['清淡', '偏辣', '偏甜', '重口'].map((item) => <button key={item} onClick={() => setTaste({ ...taste, flavor: item })} className={`chip text-xs ${taste.flavor === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}</div></div>
        <div className="space-y-2"><p className="text-xs text-text/75">忌口</p><input value={taste.avoid.join('、')} onChange={(e) => setTaste({ ...taste, avoid: e.target.value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) })} className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" /></div>
        <div className="space-y-2"><p className="text-xs text-text/75">饮食目标</p><input value={taste.goal} onChange={(e) => setTaste({ ...taste, goal: e.target.value })} className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" /></div>
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">参考目标</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1"><label className="muted">热量 kcal</label><input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="numeric" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" /></div>
          <div className="space-y-1"><label className="muted">身高 cm</label><input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" /></div>
          <div className="space-y-1"><label className="muted">饮水 ml</label><input value={waterGoal} onChange={(e) => setWaterGoal(e.target.value)} inputMode="numeric" className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" /></div>
        </div>
        <p className="muted">只是参考，不是必须完成的考试线。</p>
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">分身信息</h2>
        <div className="space-y-2"><label className="text-xs text-text/75">名字</label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-text/75">性格</p><div className="grid grid-cols-3 gap-2">{(Object.keys(personalityLabel) as Personality[]).map((personality) => <button key={personality} onClick={() => setDraft({ ...draft, personality })} className={`rounded-2xl py-2 text-[11px] ${draft.personality === personality ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{personalityLabel[personality]}</button>)}</div></div>
        <OptionRow title="脸型" options={faceOptions} value={draft.face} onChange={(face) => setDraft({ ...draft, face })} />
        <OptionRow title="发型" options={hairOptions} value={draft.hair} onChange={(hair) => setDraft({ ...draft, hair })} />
        <OptionRow title="肤色" options={skinOptions} value={draft.skin} onChange={(skin) => setDraft({ ...draft, skin })} />
        <OptionRow title="上装" options={outfitOptions} value={draft.outfit} onChange={(outfit) => setDraft({ ...draft, outfit })} />
        <OptionRow title="下装" options={bottomOptions} value={draft.bottom ?? 'shortsMix'} onChange={(bottom) => setDraft({ ...draft, bottom })} />
        <OptionRow title="鞋子" options={shoesOptions} value={draft.shoes ?? 'sneaker'} onChange={(shoes) => setDraft({ ...draft, shoes })} />
        <OptionRow title="配饰" options={accessoryOptions} value={draft.accessory} onChange={(accessory) => setDraft({ ...draft, accessory })} />
        <OptionRow title="场景" options={backgroundOptions} value={draft.background ?? 'sunny'} onChange={(background) => setDraft({ ...draft, background })} />
        <OptionRow title="动作" options={actionOptions} value={draft.action ?? 'none'} onChange={(action) => setDraft({ ...draft, action })} />
      </section>

      <button onClick={save} className="btn-primary w-full">保存设置</button>
      <button onClick={() => setConfirmOpen(true)} className="btn-secondary w-full text-peachStrong">清除本机数据</button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="确认清除吗？">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text/80">这会清空记录、星星、衣柜和分身设置，且无法恢复。确定要重新开始吗？</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmOpen(false)} className="btn-secondary">再想想</button>
            <button onClick={() => { dispatch({ type: 'CLEAR_DATA' }); dispatch({ type: 'OPEN_APP', date: todayKey() }); setConfirmOpen(false); notify('已经重新开始啦'); navigate('/me'); }} className="btn-reward">确认清除</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
