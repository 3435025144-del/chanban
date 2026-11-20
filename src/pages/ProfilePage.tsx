import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { ReminderSettings } from '../types';
import { todayKey } from '../utils/date';

const activityLevels = ['轻度活动', '规律运动', '高强度活动'];

export default function ProfilePage() {
  const { state, dispatch, notify, profileComplete } = useApp();
  const navigate = useNavigate();
  const [tasteOpen, setTasteOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [flavor, setFlavor] = useState(state.tasteProfile.flavor);
  const [avoid, setAvoid] = useState(state.tasteProfile.avoid.join('、'));
  const [goal, setGoal] = useState(state.tasteProfile.goal);
  const [activity, setActivity] = useState(state.activityLevel ?? '轻度活动');
  const [age, setAge] = useState(state.age ? String(state.age) : '');
  const [height, setHeight] = useState(String(state.height));
  const [weight, setWeight] = useState('');
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
    notify('模拟提醒已设置：早 ' + times.morning + ' · 午 ' + times.noon + ' · 晚 ' + times.evening);
  };
  const saveActivity = () => {
    const ageNum = age.trim() ? Number(age) : undefined;
    const heightNum = Number(height);
    const weightNum = weight.trim() ? Number(weight) : undefined;
    if (heightNum < 100 || heightNum > 230) { notify('身高请填 100–230 cm'); return; }
    if (ageNum !== undefined && (ageNum < 10 || ageNum > 100)) { notify('年龄请填 10–100'); return; }
    dispatch({ type: 'SET_PROFILE', patch: { age: ageNum, activityLevel: activity } });
    dispatch({ type: 'SET_HEIGHT', height: heightNum });
    if (weightNum && weightNum >= 20 && weightNum <= 300) dispatch({ type: 'SET_WEIGHT', date: todayKey(), weight: weightNum });
    setActivityOpen(false);
    notify(profileComplete ? '资料更新好啦' : '资料存好啦，预计消耗可以显示了');
  };

  const group = 'space-y-2 rounded-[22px] bg-surface p-3';

  return (
    <div className="space-y-3 px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">你的小小成就都在这里</p>
          <h1 className="mt-1 text-[31px] font-bold leading-tight text-text">我的</h1>
        </div>
        <span className="chip shrink-0 bg-yellowSoft px-3 py-2 text-xs font-bold text-yellowText tabular-nums"><Icon name="star" size={13} className="mr-1 inline" />连续 {state.streakDays} 天</span>
      </header>

      <section className="rounded-[24px] bg-greenSoft p-4 shadow-card">
        <Link to="/avatar" className="flex items-center gap-3">
          <div className="shrink-0 overflow-hidden rounded-[20px] bg-card p-1 shadow-card"><Avatar config={state.avatar.equipped} size={72} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-text">{state.avatar.equipped.name}</p>
            <p className="muted mt-0.5 leading-relaxed">谢谢你一直温柔地照顾自己，也愿意好好吃一顿。</p>
            <span className="mt-2 inline-block rounded-full bg-card px-3 py-1 text-[11px] font-medium text-greenText shadow-card">Lv.{state.avatar.level} · {state.avatar.mood}</span>
          </div>
          <Icon name="chevronRight" size={18} className="shrink-0 text-textMuted" />
        </Link>
      </section>

      <section className="flex items-center gap-3 rounded-[24px] bg-yellowSoft p-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card text-yellowText"><Icon name="heart" size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text tabular-nums">这个月，你认真吃饭 {thisMonth} 次</p>
          <p className="mt-1 text-[11px] text-text/70 tabular-nums">{lastMonth === 0 ? '上个月还没有记录可比' : diff >= 0 ? `比上个月多 ${diff} 次` : `比上个月少 ${Math.abs(diff)} 次`}，继续保持自己的节奏。</p>
        </div>
      </section>

      <section className={group}>
        <div className="flex items-center justify-between px-1"><h2 className="section-title">吃饭偏好</h2><span className="muted">让小馋更懂你</span></div>
        <button onClick={() => setTasteOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-greenSoft text-greenText"><Icon name="filter" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">口味与忌口</span><span className="muted block truncate">{state.tasteProfile.flavor} · {state.tasteProfile.avoid.join(' · ')}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setGoalOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-peachSoft text-peachText"><Icon name="chart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">饮食目标</span><span className="muted block truncate">{state.tasteProfile.goal}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setActivityOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyanSoft text-cyanText"><Icon name="walk" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">日常活动水平</span><span className="muted tabular-nums">{state.activityLevel ?? '轻度活动'} · {profileComplete ? '预计消耗已开启' : '完善资料后查看预计消耗'}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
      </section>

      <section className={group}>
        <div className="flex items-center justify-between px-1"><h2 className="section-title">照顾自己</h2><span className="muted">按你舒服的节奏</span></div>
        <button onClick={() => setRemindersOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellowSoft text-yellowText"><Icon name="bell" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">提醒设置</span><span className="muted tabular-nums">早 {state.reminderTimes.morning} · 午 {state.reminderTimes.noon} · 晚 {state.reminderTimes.evening}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <Link to="/settings" className="flex min-h-[56px] items-center gap-3 rounded-[16px] bg-card p-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-avatarPinkSoft text-peachText"><Icon name="avatar" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">分身名字与性格</span><span className="muted">现在叫 {state.avatar.equipped.name}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </Link>
        <button onClick={() => setPrivacyOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyanSoft text-cyanText"><Icon name="shield" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">隐私与数据</span><span className="muted">记录只属于你</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setHealthOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellowSoft text-yellowText"><Icon name="heart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">健康数据连接</span><span className="muted">{state.healthConnected ? '已连接（演示）' : '尚未连接'}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setAboutOpen(true)} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-textMuted"><Icon name="info" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">关于馋伴</span><span className="muted">不审判，只陪你</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
      </section>

      <section className="flex items-center gap-3 rounded-[22px] bg-peachSoft p-4 shadow-card">
        <Hamster size={52} />
        <div>
          <p className="text-[13px] leading-relaxed text-text/80">“今天不用做到最好，好好吃一顿就已经很棒。”</p>
          <p className="mt-1 text-right text-[11px] text-peachText">—— 小馋</p>
        </div>
      </section>

      <Modal open={tasteOpen} onClose={() => setTasteOpen(false)} title="口味与忌口">
        <div className="space-y-4">
          <div className="space-y-2"><p className="text-xs font-medium text-text/75">口味</p><div className="flex flex-wrap gap-2">{['清淡', '偏辣', '偏甜', '重口'].map((item) => <button key={item} onClick={() => setFlavor(item)} className={`chip text-xs ${flavor === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}</div></div>
          <div className="space-y-2"><p className="text-xs font-medium text-text/75">忌口（用逗号分隔）</p><input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="不吃香菜、少辣" className="w-full rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" /></div>
          <button onClick={() => { dispatch({ type: 'SET_TASTE_PROFILE', patch: { flavor, avoid: avoid.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) } }); setTasteOpen(false); notify('口味偏好记好啦'); }} className="btn-primary w-full">保存偏好</button>
        </div>
      </Modal>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="饮食目标">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{['保持体重 · 晚餐清淡', '慢慢吃得规律一点', '想更轻松地照顾自己'].map((item) => <button key={item} onClick={() => setGoal(item)} className={`chip text-xs ${goal === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}</div>
          <button onClick={() => { dispatch({ type: 'SET_TASTE_PROFILE', patch: { goal } }); setGoalOpen(false); notify('目标已经记下啦'); }} className="btn-primary w-full">保存目标</button>
        </div>
      </Modal>

      <Modal open={activityOpen} onClose={() => setActivityOpen(false)} title="日常活动水平与资料">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{activityLevels.map((item) => <button key={item} onClick={() => setActivity(item)} className={`chip text-xs ${activity === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}</div>
          <div className="grid grid-cols-3 gap-2">
            <label className="rounded-2xl bg-surface p-2 text-[11px] text-text/70">年龄<input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" className="w-full bg-transparent text-sm font-bold text-text outline-none" /></label>
            <label className="rounded-2xl bg-surface p-2 text-[11px] text-text/70">身高 cm<input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" className="w-full bg-transparent text-sm font-bold text-text outline-none" /></label>
            <label className="rounded-2xl bg-surface p-2 text-[11px] text-text/70">体重 kg<input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="选填" className="w-full bg-transparent text-sm font-bold text-text outline-none" /></label>
          </div>
          <p className="muted">资料只保存在本机，用来估算预计消耗；缺失时不会显示估算值。</p>
          <button onClick={saveActivity} className="btn-primary w-full">保存资料</button>
        </div>
      </Modal>

      <Modal open={remindersOpen} onClose={() => setRemindersOpen(false)} title="提醒设置">
        <div className="space-y-3">
          {([['water', '喝水提醒'], ['meals', '三餐记录提醒'], ['cheer', '晚间见一面提醒']] as [keyof ReminderSettings, string][]).map(([key, label]) => (
            <button key={key} onClick={() => toggleReminder(key)} className="flex w-full items-center justify-between rounded-2xl bg-surface px-3 py-3 text-left">
              <span className="text-sm text-text">{label}</span>
              <span className={`flex h-6 w-10 items-center rounded-full px-0.5 ${state.reminders[key] ? 'bg-primary' : 'bg-border'}`}><span className={`h-5 w-5 rounded-full bg-card shadow-card transition-transform ${state.reminders[key] ? 'translate-x-4' : ''}`} /></span>
            </button>
          ))}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-3">
            {([['morning', '早上'], ['noon', '中午'], ['evening', '晚上']] as const).map(([key, label]) => (
              <label key={key} className="flex flex-col items-center gap-1 rounded-2xl bg-card p-2 text-[10px] text-textMuted">{label}
                <input type="time" value={times[key]} onChange={(e) => setTimes({ ...times, [key]: e.target.value })} className="w-full bg-transparent text-center text-xs font-medium text-text outline-none" />
              </label>
            ))}
          </div>
          <button onClick={saveReminderTimes} className="btn-primary w-full">保存提醒时间</button>
          <p className="muted">演示版会模拟定时推送，不会真的发送通知。</p>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="隐私与数据">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text/80">你的记录、照片和分身设置只保存在当前设备的浏览器里。馋伴不会上传，也不会拿它们做评判。</p>
          <button onClick={() => { setPrivacyOpen(false); navigate('/settings'); }} className="btn-secondary w-full">去设置里管理数据</button>
        </div>
      </Modal>

      <Modal open={healthOpen} onClose={() => setHealthOpen(false)} title="健康数据连接">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-text/80">连接后可用于更准确地估算活动消耗。当前为演示版，不会读取系统健康数据。</p>
          <button onClick={() => { dispatch({ type: 'SET_HEALTH_CONNECTED', connected: !state.healthConnected }); notify(state.healthConnected ? '已断开（演示）' : '已连接（演示）'); }} className={state.healthConnected ? 'btn-secondary w-full' : 'btn-primary w-full'}>{state.healthConnected ? '断开连接' : '模拟连接'}</button>
        </div>
      </Modal>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="关于馋伴">
        <div className="space-y-3 text-sm leading-relaxed text-text/80">
          <p>馋伴是一只住在手机里的小分身，陪你把吃饭、喝水、散步这些小事慢慢记下来。</p>
          <p>这里没有教练，没有身材焦虑。放纵餐也可以被喜欢，重复礼物会变成碎片，所有奖励只增不减。</p>
          <p className="muted">版本 V5 · 用温柔的方式陪你。</p>
        </div>
      </Modal>
    </div>
  );
}
