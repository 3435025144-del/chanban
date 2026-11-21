import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import StarBadge from '../components/StarBadge';
import { useApp } from '../context/AppContext';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

const moods = ['开心', '平静', '有点累', '馋馋的', '想被夸'];
const decorItems = [
  { id: 'hat', label: '小礼帽', emoji: '🎩', cost: 5 },
  { id: 'scarf', label: '软围巾', emoji: '🧣', cost: 5 },
  { id: 'leaf', label: '叶子发饰', emoji: '🍃', cost: 5 },
  { id: 'toy', label: '小摆件', emoji: '🏺', cost: 5 },
];
const starWays = [
  { icon: 'edit', title: '记录一餐', desc: '把吃过的写下来，+1 星' },
  { icon: 'cup', title: '记录喝水', desc: '每天第一次喝水打卡，+1 星' },
  { icon: 'walk', title: '运动打卡', desc: '完成一次运动打卡，+1 星' },
  { icon: 'sparkle', title: '扛馋打卡', desc: '温柔地停下来，+1 星' },
  { icon: 'gift', title: '每日打开', desc: '每天来看看小馋，+1 星' },
  { icon: 'star', title: '如实记录放纵餐', desc: '不责怪自己，额外 +1 星' },
] as const;
const hamsterLines = [
  '吱吱！今天也要好好吃饭～',
  '鼠鼠伸了个懒腰 🐹',
  '鼠鼠转了个圈圈！',
  '悄悄把一颗星星放进你口袋 ✨',
];
const rooms = [
  { label: '客厅', emoji: '🛋️' },
  { label: '卧室', emoji: '🛏️' },
  { label: '厨房', emoji: '🍽️' },
];

export default function AvatarPage() {
  const { state, dispatch, todayLog, todayWaterMl, todayMeals, todayStars, todayEarned, todayMood, notify } = useApp();
  const today = todayKey();
  const [tab, setTab] = useState<'avatar' | 'friends' | 'house'>('avatar');
  const [moodOpen, setMoodOpen] = useState(false);
  const [mood, setMood] = useState(todayMood?.mood ?? '开心');
  const [moodNote, setMoodNote] = useState(todayMood?.note ?? '');
  const [growthOpen, setGrowthOpen] = useState(false);
  const [starGuideOpen, setStarGuideOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [hamsterLine, setHamsterLine] = useState('点一下鼠鼠，它会做动作给你看');
  const [hopKey, setHopKey] = useState(0);

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
  const equipped = state.avatar.equipped;
  const clothesCount = new Set([
    equipped.hair, equipped.outfit, equipped.bottom, equipped.shoes,
    equipped.accessory !== 'none' ? equipped.accessory : '',
    ...state.blindBox.ownedItems,
  ].filter(Boolean)).size;
  const statusText = equipped.personality === 'gentle'
    ? '慢慢吃饭，也在慢慢长大'
    : equipped.personality === 'sassy' ? '今天也要好好吃饭呀' : '快乐吃饭，认真长大';

  const heartsFor = (id: string) => state.dailyRewardDates.filter((key) => key.startsWith(`heart-${id}-`)).length;
  const rankRows = [
    { id: 'me', name: equipped.name, tag: state.tasteProfile.flavors[0] ?? '慢慢吃饭', hearts: heartsFor('me'), days: state.streakDays, me: true },
    ...state.friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      tag: friend.note ?? '慢慢吃饭',
      hearts: heartsFor(friend.id),
      days: friend.streak ?? 0,
      me: false,
    })),
  ].sort((a, b) => b.hearts - a.hearts || b.days - a.days);

  const decorEmoji = decorItems.find((item) => item.id === state.hamsterDecorEquipped)?.emoji ?? '';

  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(waterClaimed ? '又陪我喝了一杯' : '喝水打卡，收到一颗星');
  };
  const saveMood = () => {
    dispatch({ type: 'SET_MOOD', date: today, mood, note: moodNote.trim() || undefined });
    setMoodOpen(false);
    notify(moodClaimed ? '今天的心情记好啦' : '心情记下来啦，收到一颗星');
  };
  const finishBreathing = (result: 'resisted' | 'ate') => {
    dispatch({ type: 'CRAVING', result, date: today });
    setPhase('idle'); setSeconds(60);
    notify(result === 'resisted' ? '你陪自己停下来了，收到一颗星' : '吃了也没关系，照样收到一颗星');
  };
  const tapHamster = () => {
    setHamsterLine(hamsterLines[Math.floor(Math.random() * hamsterLines.length)]);
    setHopKey((key) => key + 1);
  };
  const sendHeart = (id: string) => {
    if (state.dailyRewardDates.includes(`heart-${id}-${today}`)) { notify('今天已经给 TA 点过赞啦，点赞不能撤回'); return; }
    dispatch({ type: 'SEND_HEART', id, date: today });
    notify('本周收到的赞 +1');
  };

  return (
    <div className="av-page min-h-screen space-y-3 bg-page px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">{tab === 'house' ? '陪鼠鼠一点点长大' : tab === 'friends' ? '有人陪着，吃饭更有意思' : '陪你一点点长大'}</p>
          <h1 className="mt-1 text-[31px] font-bold leading-tight text-text">{tab === 'house' ? '鼠鼠' : tab === 'friends' ? '搭子' : '小馋'}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StarBadge onClick={() => setStarGuideOpen(true)} />
          <Link to="/friends" className="av-add-friend-btn" aria-label="加好友，进入好友搭子">
            <Icon name="plus" size={13} strokeWidth={2.4} />
            <span>加搭子</span>
          </Link>
        </div>
      </header>

      <div className="av-tab-bar">
        {([['avatar', '我的分身'], ['friends', '好友搭子'], ['house', '小鼠屋']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`av-tab-btn ${tab === id ? 'av-tab-active' : ''}`}>{label}</button>
        ))}
      </div>

      {tab === 'avatar' ? (
        <>
          <section className="av-card space-y-4 p-5">
            <div className="mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[26px] bg-greenSoft/40">
              <Avatar config={equipped} fill className="animate-idle" />
            </div>
            <div className="pt-1 text-center">
              <p className="text-[17px] font-extrabold text-text">{equipped.name}</p>
              <p className="mt-1 text-[12px] text-textMuted">{statusText}</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <button onClick={() => setStarGuideOpen(true)} className="rounded-[16px] bg-surface px-1 py-3.5 text-center" aria-label="查看星星获取方式">
                <p className="text-[17px] font-bold text-text tabular-nums">{state.blindBox.stars}</p>
                <p className="mt-1 text-[11px] leading-tight text-textMuted">星星数量</p>
              </button>
              <button onClick={() => setGrowthOpen(true)} className="rounded-[16px] bg-surface px-1 py-3.5 text-center">
                <p className="text-[17px] font-bold text-text tabular-nums">{state.streakDays}</p>
                <p className="mt-1 text-[11px] leading-tight text-textMuted">连续记录天数</p>
              </button>
              <div className="rounded-[16px] bg-surface px-1 py-3.5 text-center">
                <p className="text-[17px] font-bold text-text tabular-nums">{clothesCount}</p>
                <p className="mt-1 text-[11px] leading-tight text-textMuted">已获得服装总数</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link to="/star-box" className="av-primary-btn flex items-center justify-center gap-1.5 text-[13px]"><Icon name="gift" size={16} />打开星星盒</Link>
              <Link to="/wardrobe" className="btn-secondary flex items-center justify-center gap-1.5 text-[13px]"><Icon name="hanger" size={16} />去衣橱</Link>
            </div>
            <button onClick={() => setGrowthOpen(true)} className="w-full text-center text-xs text-primary">查看成长记录</button>
          </section>

          <section className="space-y-2 rounded-[24px] bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="section-title">今日任务</h2>
              <span className="text-[11px] text-textMuted tabular-nums">今天已获得 {todayEarned}/8 星</span>
            </div>
            <Link to="/record" className="flex min-h-[56px] items-center gap-3 rounded-[16px] border border-border bg-card p-3 text-left shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-softPink/40 text-greenText"><Icon name="camera" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">记录一餐</span><span className="muted">拍照或手记都可以</span></span>
              <span className="chip bg-card px-2.5 py-1 text-[11px] text-primary tabular-nums shadow-card">{todayMeals}/3</span>
            </Link>
            <button onClick={addWater} className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] border border-border bg-softPink/40 p-3 text-left shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-cyanText"><Icon name="cup" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">陪我喝水</span><span className="muted tabular-nums">今天已喝 {todayWaterMl} ml</span></span>
              <span className={`chip px-2.5 py-1 text-[11px] ${waterClaimed ? 'bg-card text-[#A65B4D]' : 'bg-surface text-primary'}`}>{waterClaimed ? '✓ 已完成' : '+1 星'}</span>
            </button>
            <button disabled={moodClaimed} onClick={() => { if (moodClaimed) { notify('今天的心情已经记下，不能修改啦'); return; } setMood(todayMood?.mood ?? '开心'); setMoodNote(todayMood?.note ?? ''); setMoodOpen(true); }}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] border border-border bg-card p-3 text-left shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-softPink/40 text-yellowText"><Icon name="heart" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">记录今天的心情</span><span className="muted">{todayMood ? `今天：${todayMood.mood} · 已记录不可修改` : '一句话也可以'}</span></span>
              <span className={`chip px-2.5 py-1 text-[11px] shadow-card ${moodClaimed ? 'bg-card text-[#A65B4D]' : 'bg-card text-primary'}`}>{moodClaimed ? '✓ 已完成' : '+1 星'}</span>
            </button>
            <button onClick={() => { if (!cheerClaimed) { dispatch({ type: 'CLAIM_CHEER', date: today }); notify('收下今日星星'); } }}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] border border-border bg-softPink/40 p-3 text-left shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-greenText"><Icon name="star" size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text">收下今日星星</span><span className="muted">每天一次的小小鼓励</span></span>
              <span className={`chip px-2.5 py-1 text-[11px] ${cheerClaimed ? 'bg-card text-[#A65B4D]' : 'bg-surface text-primary'}`}>{cheerClaimed ? '✓ 已领取' : '+1 星'}</span>
            </button>
            <p className="muted leading-relaxed">仅早 / 午 / 晚餐计入餐数，加餐和夜宵不算；心情一天只记一次。每天最多获得 8 颗星。</p>
          </section>
        </>
      ) : tab === 'friends' ? (
        <>
          <section className="av-friends-invite">
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-extrabold leading-7 text-[#7a4a4a]">找搭子，一起稳稳瘦</h2>
              <p className="mt-1 text-[12px] text-[#9a6a6a]">互相陪伴打卡，一起看新衣服</p>
            </div>
            <button onClick={() => notify('邀请链接已复制，快发给好朋友吧～')} className="av-invite-btn">邀请</button>
          </section>

          <section className="av-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-text">好友穿搭动态</h2>
              <span className="text-[11px] text-textMuted">今天也要互相鼓励</span>
            </div>
            <div className="mt-3 space-y-2">
              {rankRows.filter((row) => !row.me).length === 0 ? (
                <div className="rounded-[16px] bg-surface px-4 py-8 text-center">
                  <span className="text-3xl">🐹</span>
                  <p className="mt-2 text-[13px] text-textMuted">还没有好友，点上方"邀请"找搭子吧</p>
                </div>
              ) : rankRows.filter((row) => !row.me).map((row, index) => {
                const friendLooks = ['粉色蝴蝶结', '奶蓝小裙子', '薄荷绿卫衣', '奶油色针织', '樱桃发夹', '云朵短靴'];
                const friendMeals = [2, 3, 1, 2, 4, 2];
                const liked = state.dailyRewardDates.includes(`heart-${row.id}-${today}`);
                return (
                  <div key={row.id} className="av-friend-row">
                    <div className={`av-friend-avatar av-friend-avatar-${index % 4}`}>
                      <Hamster size={44} mood={index % 2 ? 'cheer' : 'happy'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-text">{row.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-textMuted">今天穿了「{friendLooks[index % friendLooks.length]}」</p>
                      <p className="mt-0.5 text-[11px] text-textMuted">已记录 {friendMeals[index % friendMeals.length]} 餐 · 连续 {row.days} 天</p>
                    </div>
                    <button onClick={() => sendHeart(row.id)} className={`av-heart-btn ${liked ? 'av-heart-liked' : ''}`} aria-label={`给${row.name}点赞`}>
                      <span className="text-lg leading-none">{liked ? '❤️' : '🤍'}</span>
                      <span className="mt-0.5 text-[10px] font-bold tabular-nums">{row.hearts}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="av-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-text">今日穿搭人气榜</h2>
              <span className="text-[11px] text-textMuted">👑 大家都在夸</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {rankRows.slice(0, 3).map((row, index) => (
                <div key={row.id} className="av-rank-item">
                  <span className="av-rank-crown">{['👑', '🥈', '🥉'][index]}</span>
                  <div className={`av-friend-avatar av-friend-avatar-${index % 4}`}><Hamster size={40} mood="cheer" /></div>
                  <p className="mt-1 truncate text-[11px] font-bold text-text">{row.name}</p>
                  <p className="text-[10px] text-textMuted tabular-nums">{row.hearts} 赞</p>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" className="mt-3 block text-center text-[12px] font-semibold text-primary">查看完整穿搭榜 ›</Link>
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
              <p className="text-[13px] font-bold text-text">鼠鼠在今天陪着你</p>
              <p key={hopKey} className="mt-1 text-xs leading-relaxed text-text/80 animate-pop-in">“{hamsterLine}”</p>
              <button onClick={() => setDecorOpen(true)} className="mt-2 text-[11px] font-medium text-peachText underline">给鼠鼠戴点东西 →</button>
            </div>
          </section>

          <section className="space-y-2">
            <div className="relative mx-auto w-full max-w-[320px] pt-9">
              <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-b-[42px] border-l-[158px] border-r-[158px] border-b-[#F2D5D2] border-l-transparent border-r-transparent" />
              <div className="rounded-b-[22px] border border-[#E5D9B8] bg-[#FFFDF6] p-3 shadow-card">
                <div className="grid grid-cols-3 divide-x divide-[#E5D9B8] overflow-hidden rounded-[14px] border border-[#E5D9B8] bg-[#FFF9E8]">
                  {rooms.map((room, index) => (
                    <div key={room.label} className="flex min-h-[132px] flex-col items-center justify-center gap-1 px-1 py-2 text-center">
                      <span className="text-[10px] font-bold text-text">{room.label}</span>
                      {index === 1 ? (
                        <button onClick={tapHamster} className="animate-hamster-bob" aria-label="和鼠鼠互动">
                          <span key={hopKey} className="inline-block animate-hamster-jump"><Hamster size={56} mood="cheer" /></span>
                        </button>
                      ) : <span className="text-2xl">{room.emoji}</span>}
                      <span className="text-[10px] text-textMuted">{index === 1 ? '点我' : room.emoji}</span>
                    </div>
                  ))}
                </div>
                <p key={`line-${hopKey}`} className="mt-2 text-center text-[11px] text-text/75 animate-pop-in">{hamsterLine}</p>
                <div className="mx-auto mt-2 h-4 w-12 rounded-b-[8px] border border-t-0 border-[#E5D9B8] bg-[#F2D5D2]" />
              </div>
            </div>
            <p className="text-center text-xs text-textMuted">更多功能正在开发中~</p>
          </section>

          <section className="card space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="section-title">抗馋急救</h2>
              {cravingDone && <span className="chip bg-greenSoft px-2.5 py-1 text-[11px] text-greenText">✓ 今天已陪自己停过</span>}
            </div>
            <p className="muted leading-relaxed">嘴馋没关系，先陪自己慢慢呼吸一分钟。</p>
            <button onClick={() => { setSeconds(60); setPhase('breathing'); }} className="flex min-h-[56px] w-full items-center justify-between rounded-[16px] bg-peachSoft p-3 text-left">
              <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-peachText"><Icon name="sparkle" size={18} /></span><span><span className="block text-sm font-bold text-text">我现在好馋</span><span className="muted">60 秒呼吸</span></span></span>
              <Icon name="chevronRight" size={17} className="text-peachText" />
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
        </>
      )}

      <Modal open={decorOpen} onClose={() => setDecorOpen(false)} title="给小馋戴点东西">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-[18px] bg-yellowSoft p-3"><Hamster size={56} /><p className="text-xs text-text/75">星星和衣橱共用，但小馋的装饰单独保存。</p></div>
          <div className="grid grid-cols-2 gap-2">
            {decorItems.map((item) => {
              const owned = state.hamsterDecorOwned.includes(item.id);
              const active = state.hamsterDecorEquipped === item.id;
              return (
                <div key={item.id} className="rounded-[18px] bg-surface p-3 text-center">
                  <p className="text-3xl">{owned ? item.emoji : '🔒'}</p>
                  <p className="mt-1 text-xs font-bold text-text">{item.label}</p>
                  <button onClick={() => {
                    if (owned) dispatch({ type: 'EQUIP_HAMSTER_DECOR', id: item.id });
                    else if (state.blindBox.stars >= item.cost) dispatch({ type: 'BUY_HAMSTER_DECOR', id: item.id, cost: item.cost });
                    else notify('星星不够，先去赚几颗吧');
                  }} className={`chip mt-2 w-full py-1.5 text-[11px] ${active ? 'bg-greenSoft text-greenText' : 'bg-card text-primary shadow-card'}`}>
                    {active ? '✓ 已戴上' : owned ? '戴上' : `${item.cost} 星解锁`}
                  </button>
                </div>
              );
            })}
          </div>
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
              <div><p className="muted">星星从哪里来</p><h3 className="mt-1 text-[19px] font-bold text-text">攒星小指南</h3></div>
              <button onClick={() => setStarGuideOpen(false)} className="icon-btn h-9 w-9 shrink-0" aria-label="关闭星星指南"><Icon name="close" size={18} /></button>
            </div>
            <div className="no-scrollbar max-h-[48vh] overflow-y-auto px-5">
              <div className="space-y-2 pb-3">
                {starWays.map((way) => (
                  <div key={way.title} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card text-primary"><Icon name={way.icon} size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-text">{way.title}</span><span className="block text-[10px] text-textMuted">{way.desc}</span></span>
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
