import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import {
  COMMON_TABOO_GROUPS, DIETARY_TABOOS, DIETARY_TABOO_PLACEHOLDERS, FLAVOR_OPTIONS,
  GOAL_OPTIONS, TABOO_TABS, goalPlan, goalTitle, type TabooTab,
} from '../data/tasteOptions';
import type { ReminderSettings } from '../types';
import { todayKey } from '../utils/date';

const activityLevels = ['轻度活动', '规律运动', '高强度活动'];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function ProfilePage() {
  const { state, dispatch, notify, profileComplete } = useApp();
  const navigate = useNavigate();
  const [tasteOpen, setTasteOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [tabooTab, setTabooTab] = useState<TabooTab>('饮食禁忌');

  const [flavors, setFlavors] = useState<string[]>(state.tasteProfile.flavors);
  const [dietaryTaboos, setDietaryTaboos] = useState<string[]>(state.tasteProfile.dietaryTaboos);
  const [dietaryNotes, setDietaryNotes] = useState<Record<string, string>>(state.tasteProfile.dietaryTabooNotes);
  const [avoid, setAvoid] = useState<string[]>(state.tasteProfile.avoid);
  const [goal, setGoal] = useState(state.tasteProfile.goal);

  const activePlan = goalPlan(goal);

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

  const selectedGoal = GOAL_OPTIONS.find((option) => option.id === goal);

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

  const saveTaste = () => {
    const safeFlavors = flavors.length ? flavors : ['清淡'];
    dispatch({
      type: 'SET_TASTE_PROFILE',
      patch: { flavor: safeFlavors[0], flavors: safeFlavors, dietaryTaboos, dietaryTabooNotes: dietaryNotes, avoid },
    });
    setTasteOpen(false);
    notify('口味偏好记好啦');
  };

  const confirmGoal = () => {
    if (!selectedGoal) return;
    dispatch({ type: 'SET_TASTE_PROFILE', patch: { goal: selectedGoal.id } });
    setGoalOpen(false);
    setPlanOpen(true);
  };

  return (
    <div className="mp-page min-h-screen space-y-3 bg-page px-5 pb-40 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">你的小小成就都在这里</p>
          <h1 className="mt-1 text-[31px] font-bold leading-tight text-text">我的</h1>
        </div>
        <span className="chip shrink-0 bg-accent px-3 py-2 text-xs font-bold text-[#202220] tabular-nums"><Icon name="star" size={13} className="mr-1 inline" />连续 {state.streakDays} 天</span>
      </header>

      <Link to="/settings?focus=avatar" className="mp-card block p-4">
        <div className="flex items-center gap-3">
          <div className="mp-icon-green shrink-0 overflow-hidden rounded-[20px] p-1"><Avatar config={state.avatar.equipped} size={72} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-text">{state.avatar.equipped.name}</p>
            <p className="muted mt-0.5 leading-relaxed">点这里改名字和性格 · 谢谢你好好照顾自己。</p>
            <span className="mp-level-tag mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-medium">Lv.{state.avatar.level} · {state.avatar.mood}</span>
          </div>
          <Icon name="chevronRight" size={18} className="shrink-0 text-textMuted" />
        </div>
      </Link>

      <Link to="/meal-calendar" className="mp-card flex items-center gap-3 p-4">
        <span className="mp-icon-guard mp-icon-yellow"><Icon name="heart" size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text tabular-nums">这个月，你认真吃饭 {thisMonth} 次</p>
          <p className="mt-1 text-[11px] text-textMuted tabular-nums">{lastMonth === 0 ? '上个月还没有记录可比' : diff >= 0 ? `比上个月多 ${diff} 次` : `比上个月少 ${Math.abs(diff)} 次`}，点开看看美食日历 →</p>
        </div>
        <Icon name="chevronRight" size={18} className="shrink-0 text-textMuted" />
      </Link>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <h2 className="mp-section-title">吃饭偏好</h2>
          <span className="muted">让小馋更懂你</span>
        </div>
        <button onClick={() => {
          setFlavors(state.tasteProfile.flavors);
          setDietaryTaboos(state.tasteProfile.dietaryTaboos);
          setDietaryNotes(state.tasteProfile.dietaryTabooNotes);
          setAvoid(state.tasteProfile.avoid);
          setTasteOpen(true);
        }} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-green"><Icon name="filter" size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-text">口味与忌口</span>
            <span className="muted block truncate">
              {state.tasteProfile.flavors.join('、')}
              {state.tasteProfile.avoid.length + state.tasteProfile.dietaryTaboos.length > 0
                ? ` · 忌口 ${state.tasteProfile.avoid.length + state.tasteProfile.dietaryTaboos.length} 项`
                : ''}
            </span>
          </span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => { setGoal(state.tasteProfile.goal); setGoalOpen(true); }} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-pink"><Icon name="chart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">饮食目标</span><span className="muted block truncate">{goalTitle(state.tasteProfile.goal)}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <h2 className="mp-section-title">照顾自己</h2>
          <span className="muted">按你舒服的节奏</span>
        </div>
        <button onClick={() => setRemindersOpen(true)} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-yellow"><Icon name="bell" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">提醒设置</span><span className="muted tabular-nums">早 {state.reminderTimes.morning} · 午 {state.reminderTimes.noon} · 晚 {state.reminderTimes.evening}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setActivityOpen(true)} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-blue"><Icon name="walk" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">日常活动水平</span><span className="muted tabular-nums">{state.activityLevel ?? '轻度活动'} · {profileComplete ? '预计消耗已开启' : '完善资料后查看预计消耗'}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setPrivacyOpen(true)} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-green"><Icon name="shield" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">隐私与数据</span><span className="muted">记录只属于你</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setHealthOpen(true)} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-yellow"><Icon name="heart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">健康数据连接</span><span className="muted">{state.healthConnected ? '已连接（演示）' : '尚未连接'}</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
        <button onClick={() => setAboutOpen(true)} className="mp-row-card">
          <span className="mp-icon-guard mp-icon-blue"><Icon name="info" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">关于馋伴</span><span className="muted">不审判，只陪你</span></span>
          <Icon name="chevronRight" size={16} className="text-textMuted" />
        </button>
      </section>

      <section className="mp-card flex items-center gap-3 p-4">
        <Hamster size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-relaxed text-text/80">“今天不用做到最好，好好吃一顿就已经很棒。”</p>
          <p className="mt-1 text-right text-[11px] text-textMuted">—— 小馋</p>
        </div>
      </section>

      <Modal open={tasteOpen} onClose={() => setTasteOpen(false)} title="口味与忌口">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-text/75">口味（可多选）</p>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_OPTIONS.map((item) => (
                <button key={item} onClick={() => setFlavors((current) => toggle(current, item))}
                  className={`chip text-xs ${flavors.includes(item) ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-text/75">忌口（可多选）</p>
            <div className="flex gap-2 border-b border-border pb-2">
              {TABOO_TABS.map((tab) => (
                <button key={tab} onClick={() => setTabooTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tabooTab === tab ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {tabooTab === '饮食禁忌' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TABOOS.map((item) => (
                    <button key={item} onClick={() => setDietaryTaboos((current) => toggle(current, item))}
                      className={`chip text-xs ${dietaryTaboos.includes(item) ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                {dietaryTaboos.includes('过敏') && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-text/75">过敏 · 请填写过敏原</span>
                    <input value={dietaryNotes['过敏'] ?? ''} onChange={(e) => setDietaryNotes((n) => ({ ...n, 过敏: e.target.value }))}
                      placeholder={DIETARY_TABOO_PLACEHOLDERS['过敏']} className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-text outline-none" />
                  </label>
                )}
                {dietaryTaboos.includes('宗教') && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-text/75">宗教 · 请填写饮食要求</span>
                    <input value={dietaryNotes['宗教'] ?? ''} onChange={(e) => setDietaryNotes((n) => ({ ...n, 宗教: e.target.value }))}
                      placeholder={DIETARY_TABOO_PLACEHOLDERS['宗教']} className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-text outline-none" />
                  </label>
                )}
                {dietaryTaboos.includes('医嘱') && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-text/75">医嘱 · 请填写医生建议</span>
                    <input value={dietaryNotes['医嘱'] ?? ''} onChange={(e) => setDietaryNotes((n) => ({ ...n, 医嘱: e.target.value }))}
                      placeholder={DIETARY_TABOO_PLACEHOLDERS['医嘱']} className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-text outline-none" />
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="muted">按常见忌口对象分别点亮，已选 {avoid.length} 项</p>
                {COMMON_TABOO_GROUPS.map((groupItem) => (
                  <div key={groupItem.name} className="space-y-1.5">
                    <p className="text-xs font-semibold text-text/80">{groupItem.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {groupItem.items.map((item) => (
                        <button key={item} onClick={() => setAvoid((current) => toggle(current, item))}
                          className={`chip text-[11px] ${avoid.includes(item) ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {avoid.length > 0 && (
                  <p className="rounded-xl bg-surface p-2 text-[11px] leading-relaxed text-textMuted">已点亮：{avoid.join('、')}</p>
                )}
              </div>
            )}
          </div>

          <button onClick={saveTaste} className="btn-primary w-full">保存偏好</button>
        </div>
      </Modal>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="你的饮食目标是？">
        <div className="space-y-3">
          <p className="-mt-1 text-xs text-textMuted">先选一个主目标，之后随时能改</p>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((option) => {
              const active = goal === option.id;
              return (
                <button key={option.id} onClick={() => setGoal(option.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left ${active ? 'border-primary bg-greenSoft' : 'border-border bg-surface'}`}>
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-primary' : 'border-textMuted'}`}>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text">{option.title}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-textMuted">{option.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="sticky bottom-0 space-y-1 bg-card pt-1">
            <button disabled={!selectedGoal} onClick={confirmGoal} className="btn-primary w-full">
              {selectedGoal?.buttonText ?? '完成，开始推荐'}
            </button>
            <button onClick={() => setGoalOpen(false)} className="w-full py-1 text-center text-xs text-textMuted">以后再说</button>
          </div>
        </div>
      </Modal>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title={selectedGoal?.buttonText ?? '给你的建议'} dismissOnMask>
        <div className="space-y-3">
          <p className="text-xs text-textMuted">为「{selectedGoal?.title ?? '你的目标'}」准备</p>
          <p className="text-sm leading-relaxed text-text/85">{activePlan?.intro}</p>
          <div className="space-y-2">
            {activePlan?.points.map((point, index) => (
              <div key={index} className="flex items-start gap-2.5 rounded-2xl bg-surface px-3 py-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primaryText">{index + 1}</span>
                <span className="text-xs leading-relaxed text-text/85">{point}</span>
              </div>
            ))}
          </div>
          <p className="rounded-2xl bg-greenSoft px-3 py-2.5 text-xs leading-relaxed text-greenText">{activePlan?.closing}</p>
          <button onClick={() => { setPlanOpen(false); notify('目标已经记下啦'); }} className="btn-primary w-full">我知道了</button>
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
