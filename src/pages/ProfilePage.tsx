import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { ReminderSettings } from '../types';
import { todayKey } from '../utils/date';

export default function ProfilePage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [tasteOpen, setTasteOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [flavor, setFlavor] = useState(state.tasteProfile.flavor);
  const [avoid, setAvoid] = useState(state.tasteProfile.avoid.join('、'));
  const [goal, setGoal] = useState(state.tasteProfile.goal);
  const [times, setTimes] = useState(state.reminderTimes);

  const now = new Date(`${todayKey()}T00:00:00`);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const countByMonth = (prefix: string) => Object.entries(state.logs)
    .filter(([date, log]) => date.startsWith(prefix) && log.records.length > 0)
    .reduce((sum, [, log]) => sum + log.records.length, 0);
  const thisMonth = countByMonth(currentMonth);
  const lastMonth = countByMonth(prevMonth);
  const diff = thisMonth - lastMonth;

  const toggleReminder = (key: keyof ReminderSettings) => {
    const next = !state.reminders[key];
    dispatch({ type: 'SET_REMINDERS', patch: { [key]: next } });
    notify(next ? '这个提醒打开啦' : '这个提醒关掉啦');
  };

  const saveReminderTimes = () => {
    dispatch({ type: 'SET_REMINDER_TIMES', times });
    setRemindersOpen(false);
    notify(`模拟提醒已设置：早 ${times.morning} · 午 ${times.noon} · 晚 ${times.evening}`);
  };

  return (
    <div className="space-y-4 px-4 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">你的小小成就都在这里</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-ink">我的</h1>
        </div>
        <span className="chip shrink-0 bg-coralSoft text-xs font-medium text-coralDeep"><Icon name="star" size={13} className="mr-1 inline" />连续 {state.streakDays} 天</span>
      </header>

      <section className="rounded-[24px] bg-gradient-to-br from-avocadoSoft to-[#F3F9E9] p-4 shadow-card">
        <Link to="/avatar" className="flex items-center gap-3 active:scale-[0.99]">
          <div className="shrink-0 rounded-[20px] bg-white p-1"><Avatar config={state.avatar.equipped} size={70} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-ink">{state.avatar.equipped.name}</p>
            <p className="muted mt-0.5 leading-relaxed">谢谢你一直温柔地照顾自己，也愿意好好吃一顿。</p>
            <span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-[11px] text-avocado shadow-card">Lv.{state.avatar.level} · {state.avatar.mood}</span>
          </div>
          <Icon name="chevronRight" size={18} className="shrink-0 text-muted" />
        </Link>
      </section>

      <section className="flex items-center gap-3 rounded-[24px] bg-avocadoSoft p-4 shadow-card">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-avocado"><Icon name="heart" size={20} /></span>
        <div>
          <p className="text-sm font-semibold text-ink">这个月，你认真吃饭 {thisMonth} 次</p>
          <p className="muted mt-1">{diff >= 0 ? `比上个月多 ${diff} 次` : `比上个月少 ${Math.abs(diff)} 次`}，继续保持自己的节奏。</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">吃饭偏好</h2>
          <span className="muted">让小馋更懂你</span>
        </div>
        <button onClick={() => setTasteOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="filter" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">口味与忌口</span><span className="muted block truncate">{state.tasteProfile.flavor} · {state.tasteProfile.avoid.join(' · ')}</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
        <button onClick={() => setGoalOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="chart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">饮食目标</span><span className="muted block truncate">{state.tasteProfile.goal}</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">照顾自己</h2>
          <span className="muted">按你舒服的节奏</span>
        </div>
        <button onClick={() => setRemindersOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="bell" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">提醒设置</span><span className="muted">早 {state.reminderTimes.morning} · 午 {state.reminderTimes.noon} · 晚 {state.reminderTimes.evening}</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
        <Link to="/settings" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="avatar" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">分身名字与性格</span><span className="muted">现在叫 {state.avatar.equipped.name}</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
        <button onClick={() => setPrivacyOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="shield" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">隐私与数据</span><span className="muted">记录只属于你</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
        <button onClick={() => setAboutOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocado"><Icon name="info" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">关于馋伴</span><span className="muted">不审判，只陪你</span></span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
      </section>

      <section className="rounded-[24px] bg-coralSoft p-4 shadow-card">
        <p className="text-sm leading-relaxed text-ink/80">“今天不用做到最好，好好吃一顿就已经很棒。”</p>
        <p className="mt-2 text-right text-xs text-coralDeep">—— 小馋</p>
      </section>

      <Modal open={tasteOpen} onClose={() => setTasteOpen(false)} title="口味与忌口">
        <div className="space-y-4">
          <div className="space-y-2"><p className="text-xs font-medium text-ink/75">口味</p><div className="flex flex-wrap gap-2">{['清淡', '偏辣', '偏甜', '重口'].map((item) => <button key={item} onClick={() => setFlavor(item)} className={`chip text-xs ${flavor === item ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{item}</button>)}</div></div>
          <div className="space-y-2"><p className="text-xs font-medium text-ink/75">忌口（用逗号分隔）</p><input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="不吃香菜、少辣" className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none" /></div>
          <button onClick={() => { dispatch({ type: 'SET_TASTE_PROFILE', patch: { flavor, avoid: avoid.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) } }); setTasteOpen(false); notify('口味偏好记好啦'); }} className="btn-primary w-full">保存偏好</button>
        </div>
      </Modal>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="饮食目标">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{['保持体重 · 晚餐清淡', '慢慢吃得规律一点', '想更轻松地照顾自己'].map((item) => <button key={item} onClick={() => setGoal(item)} className={`chip text-xs ${goal === item ? 'bg-avocado text-white' : 'bg-warm text-muted'}`}>{item}</button>)}</div>
          <button onClick={() => { dispatch({ type: 'SET_TASTE_PROFILE', patch: { goal } }); setGoalOpen(false); notify('目标已经记下啦'); }} className="btn-primary w-full">保存目标</button>
        </div>
      </Modal>

      <Modal open={remindersOpen} onClose={() => setRemindersOpen(false)} title="提醒设置">
        <div className="space-y-3">
          {([['water', '喝水提醒'], ['meals', '三餐记录提醒'], ['cheer', '晚间见一面提醒']] as [keyof ReminderSettings, string][]).map(([key, label]) => (
            <button key={key} onClick={() => toggleReminder(key)} className="flex w-full items-center justify-between rounded-2xl bg-warm px-3 py-3 text-left active:scale-[0.99]">
              <span className="text-sm text-ink">{label}</span>
              <span className={`flex h-6 w-10 items-center rounded-full px-0.5 ${state.reminders[key] ? 'bg-avocado' : 'bg-line'}`}><span className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${state.reminders[key] ? 'translate-x-4' : ''}`} /></span>
            </button>
          ))}
          <div className="space-y-2 rounded-2xl bg-warm p-3">
            <p className="text-xs font-medium text-ink/75">提醒时间（早 / 午 / 晚）</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['morning', '早上'],
                ['noon', '中午'],
                ['evening', '晚上'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-2 text-[10px] text-muted">
                  {label}
                  <input
                    type="time"
                    value={times[key]}
                    onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
                    className="w-full bg-transparent text-center text-xs font-medium text-ink outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
          <button onClick={saveReminderTimes} className="btn-primary w-full">保存提醒时间</button>
          <p className="muted">演示版会模拟定时推送，不会真的发送通知。</p>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="隐私与数据">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink/80">你的记录、照片和分身设置只保存在当前设备的浏览器里。馋伴不会上传，也不会拿它们做评判。</p>
          <button onClick={() => { setPrivacyOpen(false); navigate('/settings'); }} className="btn-secondary w-full">去设置里管理数据</button>
        </div>
      </Modal>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="关于馋伴">
        <div className="space-y-3 text-sm leading-relaxed text-ink/80">
          <p>馋伴是一只住在手机里的小分身，陪你把吃饭、喝水、散步这些小事慢慢记下来。</p>
          <p>这里没有教练，没有身材焦虑。放纵餐也可以被喜欢，重复礼物会变成碎片，所有奖励只增不减。</p>
          <p className="muted">版本 V2 · 用温柔的方式陪你。</p>
        </div>
      </Modal>
    </div>
  );
}
