import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon, { type IconName } from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { ReminderSettings } from '../types';

export default function ProfilePage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const achievements = [
    { label: '连续记录', value: `${state.streakDays} 天`, icon: 'calendar' as IconName },
    { label: '累计记录', value: `${state.totalMealsLogged} 餐`, icon: 'record' as IconName },
    { label: '分身等级', value: `Lv.${state.avatar.level}`, icon: 'avatar' as IconName },
  ];

  const toggleReminder = (key: keyof ReminderSettings) => {
    const next = !state.reminders[key];
    dispatch({ type: 'SET_REMINDERS', patch: { [key]: next } });
    notify(next ? '这个提醒打开啦' : '这个提醒关掉啦');
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <header>
        <p className="muted">你的小小成就都在这里</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">我的</h1>
      </header>

      <section className="card-important flex items-center gap-3">
        <div className="shrink-0 rounded-[20px] bg-warm p-1">
          <Avatar config={state.avatar.equipped} size={78} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">{state.avatar.equipped.name}</p>
          <p className="muted mt-0.5">Lv.{state.avatar.level} · {state.avatar.mood}</p>
          <p className="muted mt-1">谢谢你一直温柔地照顾自己。</p>
        </div>
        <Link to="/avatar" className="icon-btn shrink-0" aria-label="去分身小屋">
          <Icon name="chevronRight" size={18} />
        </Link>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">近期成就</h2>
          <span className="muted">只记录，不评判</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((item) => (
            <div key={item.label} className="rounded-2xl bg-warm p-3 text-center">
              <Icon name={item.icon} size={19} className="mx-auto text-avocadoInk" />
              <p className="mt-2 text-base font-bold text-ink">{item.value}</p>
              <p className="muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="section-title">分身养成</h2>
        <Link to="/star-box" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="gift" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">星星盒</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
        <Link to="/wardrobe" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="hanger" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">我的衣橱</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
        <Link to="/avatar" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="avatar" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">分身小屋</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
      </section>

      <section className="card space-y-2">
        <h2 className="section-title">偏好与说明</h2>
        <Link to="/settings" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="settings" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">偏好设置</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
        <button onClick={() => setRemindersOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="bell" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">提醒设置</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
        <button onClick={() => setPrivacyOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="shield" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">隐私与数据</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
        <button onClick={() => setAboutOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="info" size={18} /></span>
          <span className="flex-1 text-sm font-medium text-ink">关于馋伴</span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </button>
      </section>

      <Modal open={remindersOpen} onClose={() => setRemindersOpen(false)} title="提醒设置">
        <div className="space-y-3">
          {([
            ['water', '喝水提醒'],
            ['meals', '三餐记录提醒'],
            ['cheer', '晚间见一面提醒'],
          ] as [keyof ReminderSettings, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleReminder(key)}
              className="flex w-full items-center justify-between rounded-2xl bg-warm px-3 py-3 text-left active:scale-[0.99]"
            >
              <span className="text-sm text-ink">{label}</span>
              <span className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${state.reminders[key] ? 'bg-avocado' : 'bg-line'}`}>
                <span className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${state.reminders[key] ? 'translate-x-4' : ''}`} />
              </span>
            </button>
          ))}
          <p className="muted leading-relaxed">演示版只保存开关状态，不会真的推送通知。</p>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="隐私与数据">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink/80">
            你的记录、照片和分身设置只保存在当前设备的浏览器里。馋伴不会上传，也不会拿它们做评判。
          </p>
          <button onClick={() => { setPrivacyOpen(false); navigate('/settings'); }} className="btn-secondary w-full">去设置里管理数据</button>
        </div>
      </Modal>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="关于馋伴">
        <div className="space-y-3 text-sm leading-relaxed text-ink/80">
          <p>馋伴是一只住在手机里的小分身，陪你把吃饭、喝水、散步这些小事慢慢记下来。</p>
          <p>这里没有教练，没有身材焦虑。放纵餐也可以被喜欢，重复礼物会变成碎片，所有奖励只增不减。</p>
          <p className="muted">版本 0.1.0 · 用温柔的方式陪你。</p>
        </div>
      </Modal>
    </div>
  );
}
