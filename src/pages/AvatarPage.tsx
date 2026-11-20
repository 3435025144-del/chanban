import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import StarBadge from '../components/StarBadge';
import { useApp } from '../context/AppContext';
import { getContextLine } from '../data/avatarLines';
import type { FriendPrivacy } from '../types';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

const moods = ['开心', '平静', '有点累', '馋馋的', '想被夸'];
const decorItems = [
  { id: 'hat', label: '小礼帽', emoji: '🎩', cost: 5 },
  { id: 'scarf', label: '软围巾', emoji: '🧣', cost: 5 },
  { id: 'leaf', label: '叶子发饰', emoji: '🍃', cost: 5 },
  { id: 'toy', label: '小摆件', emoji: '🏺', cost: 5 },
];
const themes = ['本周主题 · 清爽绿', '本周主题 · 暖暖桃', '本周主题 · 天空蓝'];

const starWays = [
  { icon: 'edit', title: '记录一餐', desc: '把吃过的写下来，+1 星' },
  { icon: 'cup', title: '记录喝水', desc: '每天第一次喝水打卡，+1 星' },
  { icon: 'walk', title: '运动打卡', desc: '完成一次运动打卡，+1 星' },
  { icon: 'sparkle', title: '扛馋打卡', desc: '温柔地停下来，+1 星' },
  { icon: 'gift', title: '每日打开', desc: '每天来看看小馋，+1 星' },
  { icon: 'star', title: '如实记录放纵餐', desc: '不责怪自己，额外 +1 星' },
] as const;

export default function AvatarPage() {
  const { state, dispatch, todayLog, todayWaterMl, todayMeals, todayStars, todayEarned, todayMood, notify } = useApp();
  const today = todayKey();
  const [tab, setTab] = useState<'avatar' | 'house'>('avatar');
  const [lineSeed, setLineSeed] = useState(0);
  const [moodOpen, setMoodOpen] = useState(false);
  const [mood, setMood] = useState(todayMood?.mood ?? '开心');
  const [moodNote, setMoodNote] = useState(todayMood?.note ?? '');
  const [growthOpen, setGrowthOpen] = useState(false);
  const [starGuideOpen, setStarGuideOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [friendCode, setFriendCode] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  const [interactionLine, setInteractionLine] = useState(() => getContextLine(state.avatar.equipped.personality, {
    hour: new Date().getHours(), meals: todayMeals, waterMl: todayWaterMl, stars: todayStars, cheat: todayLog.isCheatDay,
  }));

  useEffect(() => {
    if (phase !== 'breathing') return;
    const timer = window.setInterval(() => setSeconds((s) => {
      if (s <= 1) { window.clearInterval(timer); setPhase('choice'); return 0; }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const expNeed = expToNext(state.avatar.level);
  const waterClaimed = state.waterStarDates.includes(today);
  const moodClaimed = state.moodStarDates.includes(today);
  const cheerClaimed = state.dailyCheerDates.includes(today);
  const cravingDone = todayLog.cravingResisted > 0;

  const refreshLine = () => {
    setInteractionLine(getContextLine(state.avatar.equipped.personality, {
      hour: new Date().getHours(), meals: todayMeals, waterMl: todayWaterMl, stars: todayStars, cheat: todayLog.isCheatDay,
    }));
    setLineSeed((s) => s + 1);
  };
  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(waterClaimed ? '又陪我喝了一杯' : '喝水打卡，收到一颗星');
    refreshLine();
  };
  const saveMood = () => {
    dispatch({ type: 'SET_MOOD', date: today, mood, note: moodNote.trim() || undefined });
    setMoodOpen(false);
    notify(moodClaimed ? '今天的心情记好啦' : '心情记下来啦，收到一颗星');
    refreshLine();
  };
  const finishBreathing = (result: 'resisted' | 'ate') => {
    dispatch({ type: 'CRAVING', result, date: today });
    setPhase('idle'); setSeconds(60);
    notify(result === 'resisted' ? '你陪自己停下来了，收到一颗星' : '吃了也没关系，照样收到一颗星');
    refreshLine();
  };
  const addFriend = () => {
    const code = friendCode.trim();
    if (!code) { notify('先输入好友码吧'); return; }
    dispatch({ type: 'ADD_FRIEND', friend: { id: `friend-${Date.now()}`, code, name: `好友 ${code.slice(-4)}` } });
    setFriendCode('');
    notify('好友已添加，等 TA 同步后就在这里了');
  };
  const shareCode = async () => {
    const code = `CHANBAN-${state.avatar.equipped.name}-${state.blindBox.stars}`;
    try { await navigator.clipboard.writeText(`来馋伴找我：${code}`); notify('好友码已复制'); }
    catch { notify(`我的好友码：${code}`); }
  };

  const decorEmoji = decorItems.find((item) => item.id === state.hamsterDecorEquipped)?.emoji ?? '';

  return (
    <div className="av-page min-h-screen space-y-3 bg-page px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">陪你一点点长大</p>
          <h1 className="mt-1 text-[31px] font-bold leading-tight text-text">小馋</h1>
        </div>
        <StarBadge onClick={() => setStarGuideOpen(true)} />
      </header>

      <div className="rb-segment">
        {([['avatar', '我的分身'], ['house', '小馋小屋']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rb-segment-btn ${tab === id ? 'rb-segment-active' : ''}`}>{label}</button>
        ))}
      </div>

      {tab === 'avatar' ? (
        <>
          <section className="av-card space-y-3">
            <div className="relative mx-auto w-full max-w-[300px]">
              <div className="overflow-hidden rounded-[22px] bg-greenSoft/40">
                <Avatar config={state.avatar.equipped} fill className="animate-idle" />
              </div>
              <div className="av-bubble absolute -bottom-4 -left-3 z-10">
                <Hamster size={36} />
                <span>{decorEmoji} {interactionLine}</span>
              </div>
            </div>
            <div className="pt-4 text-center">
              <p className="text-[13px] font-bold text-text">当前造型 · {state.avatar.equipped.name}</p>
              <p className="muted mt-0.5 tabular-nums">Lv.{state.avatar.level} · {state.avatar.mood}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-[14px] bg-surface p-2.5"><p className="text-base font-bold text-text tabular-nums">{state.streakDays}</p><p className="muted">连续记录天数</p></div>
              <div className="rounded-[14px] bg-surface p-2.5"><p className="text-base font-bold text-text tabular-nums">{Math.max(1, Math.ceil((expNeed - state.avatar.exp) / 10))}</p><p className="muted">距升级星</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/star-box" className="av-primary-btn flex items-center justify-center gap-1.5 text-[13px]"><Icon name="gift" size={16} />打开星星盒</Link>
              <Link to="/wardrobe" className="btn-secondary flex items-center justify-center gap-1.5 text-[13px]"><Icon name="hanger" size={16} />去衣橱</Link>
            </div>
            <div className="flex items-center justify-center gap-4 pt-1">
              <button onClick={() => setGrowthOpen(true)} className="text-xs text-primary">查看成长记录</button>
              <button onClick={() => setStarGuideOpen(true)} className="text-xs text-primary">攒星指南</button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="flex items-center gap-3 rounded-[22px] bg-peachSoft p-4 shadow-card">
            <div className="relative">
              <Hamster size={64} />
              <span className="absolute -right-1 -top-1 text-lg">{decorEmoji}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text">小馋在今天陪着你</p>
              <p key={lineSeed} className="mt-1 text-xs leading-relaxed text-text/80 animate-pop-in">“{interactionLine}”</p>
              <button onClick={() => setDecorOpen(true)} className="mt-2 text-[11px] font-medium text-peachText underline">给小馋戴点东西 →</button>
            </div>
          </section>

          <section className="card space-y-2">
            <div className="flex items-center justify-between"><h2 className="section-title">今天怎么赚星</h2><span className="text-[11px] text-textMuted tabular-nums">今日 {todayEarned} 星</span></div>
            <Link to="/record" className="flex min-h-[56px] items-center gap-3 rounded-[16px] bg-card p-3 text-left shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-greenSoft text-greenText"><Icon name="camera" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">记录一餐</span><span className="muted">拍照或手记都可以</span></span>
              <span className="chip bg-surface px-2.5 py-1 text-[11px] text-primary">+1 星</span>
            </Link>
            <button onClick={addWater} className={`flex min-h-[56px] w-full items-center gap-3 rounded-[16px] p-3 text-left ${waterClaimed ? 'bg-greenSoft' : 'bg-card shadow-card'}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyanSoft text-cyanText"><Icon name="cup" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">陪我喝水</span><span className="muted tabular-nums">今天已喝 {todayWaterMl} ml</span></span>
              <span className="chip bg-surface px-2.5 py-1 text-[11px] text-primary">{waterClaimed ? '✓ 已完成' : '+1 星'}</span>
            </button>
            <button onClick={() => { setMood(todayMood?.mood ?? '开心'); setMoodNote(todayMood?.note ?? ''); setMoodOpen(true); }} className={`flex min-h-[56px] w-full items-center gap-3 rounded-[16px] p-3 text-left ${moodClaimed ? 'bg-greenSoft' : 'bg-card shadow-card'}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellowSoft text-yellowText"><Icon name="heart" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">记录今天的心情</span><span className="muted">{todayMood ? `今天：${todayMood.mood}` : '一句话也可以'}</span></span>
              <span className="chip bg-surface px-2.5 py-1 text-[11px] text-primary">{moodClaimed ? '✓ 已完成' : '+1 星'}</span>
            </button>
            <button onClick={() => { if (!cheerClaimed) { dispatch({ type: 'CLAIM_CHEER', date: today }); notify('收下今日星星'); } }} className={`flex min-h-[56px] w-full items-center gap-3 rounded-[16px] p-3 text-left ${cheerClaimed ? 'bg-greenSoft' : 'bg-card shadow-card'}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-greenSoft text-greenText"><Icon name="star" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">收下今日星星</span><span className="muted">每天一次的小小鼓励</span></span>
              <span className="chip bg-surface px-2.5 py-1 text-[11px] text-primary">{cheerClaimed ? '✓ 已领取' : '+1 星'}</span>
            </button>
            {phase !== 'idle' && (
              <div className="rounded-[16px] bg-peachSoft p-4 text-center">
                {phase === 'breathing' ? (
                  <><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-primary/30 bg-card text-primary animate-breathe"><Icon name="sparkle" size={26} /></div><p className="mt-3 text-sm text-text">慢慢吸气…呼气…</p><p className="text-xl font-bold text-primary tabular-nums">{seconds}s</p><button onClick={() => setPhase('choice')} className="muted underline">跳过等待</button></>
                ) : (
                  <div className="grid grid-cols-2 gap-2"><button onClick={() => finishBreathing('resisted')} className="btn-primary text-xs">我停下来了</button><button onClick={() => finishBreathing('ate')} className="btn-secondary text-xs">吃了也没关系</button></div>
                )}
              </div>
            )}
          </section>

          <section className="card space-y-2">
            <div className="flex items-center justify-between"><h2 className="section-title">抗馋急救</h2>{cravingDone && <span className="chip bg-greenSoft px-2.5 py-1 text-[11px] text-greenText">✓ 今天已陪自己停过</span>}</div>
            <p className="muted leading-relaxed">嘴馋没关系，先陪自己慢慢呼吸一分钟。</p>
            <button onClick={() => { setSeconds(60); setPhase('breathing'); }} className="flex min-h-[56px] w-full items-center justify-between rounded-[16px] bg-peachSoft p-3 text-left">
              <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-peachText"><Icon name="sparkle" size={18} /></span><span><span className="block text-sm font-bold text-text">我现在好馋</span><span className="muted">60 秒呼吸</span></span></span>
              <Icon name="chevronRight" size={17} className="text-peachText" />
            </button>
          </section>

          <section className="card space-y-3">
            <div className="flex items-center justify-between"><h2 className="section-title">好友与穿搭</h2><button onClick={() => setPrivacyOpen(true)} className="text-[11px] text-primary">隐私设置</button></div>
            <div className="rounded-[16px] bg-yellowSoft p-3">
              <p className="text-[13px] font-bold text-text tabular-nums">{state.friendTheme}</p>
              <div className="mt-2 flex gap-2">
                {themes.map((theme) => <button key={theme} onClick={() => { dispatch({ type: 'SET_FRIEND_THEME', theme }); notify('主题换好啦'); }} className={`chip text-[10px] ${state.friendTheme === theme ? 'bg-card text-text shadow-card' : 'bg-card/60 text-text/70'}`}>{theme.replace('本周主题 · ', '')}</button>)}
              </div>
            </div>
            <div className="flex gap-2">
              <input value={friendCode} onChange={(e) => setFriendCode(e.target.value)} placeholder="输入好友码" className="min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
              <button onClick={addFriend} className="btn-primary shrink-0 px-4 text-xs">添加</button>
            </div>
            <button onClick={shareCode} className="btn-secondary w-full text-xs"><Icon name="copy" size={14} className="mr-1 inline" />分享我的穿搭 / 好友码</button>
            <div className="space-y-2">
              {state.friends.length === 0 && <p className="py-3 text-center text-xs text-textMuted">还没有好友，先添加一个吧。</p>}
              {state.friends.map((friend) => {
                const heartSent = state.dailyRewardDates.includes(`heart-${friend.id}-${today}`);
                return (
                  <div key={friend.id} className="flex items-center gap-3 rounded-[16px] bg-surface p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-lg">🐹</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text">{friend.name}</p>
                      <p className="muted truncate tabular-nums">{friend.stars !== undefined ? `星 ${friend.stars}` : '星星等待同步'} · {friend.streak !== undefined ? `连续 ${friend.streak} 天` : '连续等待同步'} · 爱心 {friend.hearts ?? 0}</p>
                    </div>
                    <button onClick={() => { if (!heartSent) dispatch({ type: 'SEND_HEART', id: friend.id, date: today }); notify(heartSent ? '今天已经送过爱心啦' : '爱心送到啦'); }} className={`chip px-2.5 py-1.5 text-[11px] ${heartSent ? 'bg-greenSoft text-greenText' : 'bg-card text-peachText shadow-card'}`}>{heartSent ? '✓ 已送' : '送爱心'}</button>
                    <button onClick={() => dispatch({ type: 'REMOVE_FRIEND', id: friend.id })} className="text-textMuted" aria-label="移除好友"><Icon name="close" size={14} /></button>
                  </div>
                );
              })}
            </div>
            <div className="rounded-[16px] bg-card p-3 shadow-card">
              <p className="text-xs font-bold text-text">本周穿搭榜（只比较爱心 / 星星 / 连续记录）</p>
              {[{ id: 'me', name: `${state.avatar.equipped.name}（我）`, hearts: 0, stars: state.blindBox.stars, streak: state.streakDays }, ...state.friends.map((f) => ({ id: f.id, name: f.name, hearts: f.hearts ?? 0, stars: f.stars, streak: f.streak }))]
                .sort((a, b) => b.hearts - a.hearts || (b.stars ?? 0) - (a.stars ?? 0) || (b.streak ?? 0) - (a.streak ?? 0))
                .map((row, i) => <p key={row.id} className="mt-1 text-[11px] text-text/75 tabular-nums">{i + 1}. {row.name} · 爱心 {row.hearts} · 星 {row.stars ?? '待同步'} · 连续 {row.streak ?? '待同步'}</p>)}
              <p className="muted mt-2">不比较体重、热量、食量、减脂速度或运动消耗。</p>
            </div>
          </section>
        </>
      )}

      <Modal open={decorOpen} onClose={() => setDecorOpen(false)} title="给小馋戴点东西">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-[18px] bg-yellowSoft p-3"><Hamster size={56} /><p className="text-xs text-text/75">星星和衣橱共用，但小馋的装饰单独保存。</p></div>
          <div className="grid grid-cols-2 gap-2">
            {decorItems.map((item) => {
              const owned = state.hamsterDecorOwned.includes(item.id);
              const equipped = state.hamsterDecorEquipped === item.id;
              return (
                <div key={item.id} className="rounded-[18px] bg-surface p-3 text-center">
                  <p className="text-3xl">{owned ? item.emoji : '🔒'}</p>
                  <p className="mt-1 text-xs font-bold text-text">{item.label}</p>
                  <button
                    onClick={() => {
                      if (owned) dispatch({ type: 'EQUIP_HAMSTER_DECOR', id: item.id });
                      else if (state.blindBox.stars >= item.cost) dispatch({ type: 'BUY_HAMSTER_DECOR', id: item.id, cost: item.cost });
                      else notify('星星不够，先去赚几颗吧');
                    }}
                    className={`chip mt-2 w-full py-1.5 text-[11px] ${equipped ? 'bg-greenSoft text-greenText' : 'bg-card text-primary shadow-card'}`}
                  >{equipped ? '✓ 已戴上' : owned ? '戴上' : `${item.cost} 星解锁`}</button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="好友隐私设置">
        <div className="space-y-2">
          {([['open', '公开', ' anyone 都可以看到我的穿搭'], ['friends', '仅好友', '只有好友能看到我的穿搭'], ['private', '私密', '只有我自己能看到']] as [FriendPrivacy, string, string][]).map(([id, label, desc]) => (
            <button key={id} onClick={() => { dispatch({ type: 'SET_FRIEND_PRIVACY', privacy: id }); setPrivacyOpen(false); notify(`已设为${label}`); }} className={`flex w-full items-center justify-between rounded-2xl p-3 text-left ${state.friendPrivacy === id ? 'bg-greenSoft' : 'bg-surface'}`}>
              <span><span className="block text-sm font-bold text-text">{label}</span><span className="muted">{desc.replace(' anyone ', '所有人 ')}</span></span>
              {state.friendPrivacy === id && <Icon name="check" size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={moodOpen} onClose={() => setMoodOpen(false)} title="记录今天的心情">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">{moods.map((item) => <button key={item} onClick={() => setMood(item)} className={`chip text-xs ${mood === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}</div>
          <textarea value={moodNote} onChange={(e) => setMoodNote(e.target.value)} placeholder="想对自己说点什么？（选填）" rows={3} className="w-full rounded-2xl bg-surface px-3 py-2.5 text-sm text-text outline-none" />
          <button onClick={saveMood} className="btn-primary w-full">{moodClaimed ? '保存心情' : '记下来，领一颗星'}</button>
        </div>
      </Modal>

      <Modal open={growthOpen} onClose={() => setGrowthOpen(false)} title="成长记录">
        <div className="space-y-3">
          <p className="text-sm text-text">等级 Lv.{state.avatar.level} · 经验 {state.avatar.exp}/{expNeed}</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(state.avatar.exp / expNeed * 100))}%` }} /></div>
          <p className="muted">累计记录 {state.totalMealsLogged} 餐 · 连续 {state.streakDays} 天 · 扛馋 {state.totalCravingsResisted} 次</p>
          <p className="rounded-2xl bg-surface p-3 text-xs leading-relaxed text-text/75">每一次好好吃饭、每一杯水、每一次温柔地停下来，都在让分身长大。</p>
        </div>
      </Modal>

      {starGuideOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-text/40 backdrop-blur-sm" onClick={() => setStarGuideOpen(false)}>
          <div className="animate-sheet-up max-h-[62vh] w-full max-w-[430px] overflow-hidden rounded-t-[26px] bg-card pb-[max(20px,env(safe-area-inset-bottom))] shadow-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
              <div>
                <p className="muted">星星从哪里来</p>
                <h3 className="mt-1 text-[19px] font-bold text-text">攒星小指南</h3>
              </div>
              <button onClick={() => setStarGuideOpen(false)} className="icon-btn h-9 w-9 shrink-0" aria-label="关闭星星指南"><Icon name="close" size={18} /></button>
            </div>
            <div className="no-scrollbar max-h-[48vh] overflow-y-auto px-5">
              <div className="space-y-2 pb-3">
                {starWays.map((way) => (
                  <div key={way.title} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card text-primary"><Icon name={way.icon} size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-text">{way.title}</span>
                      <span className="block text-[10px] text-textMuted">{way.desc}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-primary">+1 星</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
