import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { getContextLine } from '../data/avatarLines';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

const moods = ['开心', '平静', '有点累', '馋馋的', '想被夸'];

export default function AvatarPage() {
  const { state, dispatch, todayLog, todayWaterMl, todayMeals, todayStars, todayEarned, todayMood, notify } = useApp();
  const today = todayKey();
  const [lineSeed, setLineSeed] = useState(0);
  const [moodOpen, setMoodOpen] = useState(false);
  const [mood, setMood] = useState(todayMood?.mood ?? '开心');
  const [moodNote, setMoodNote] = useState(todayMood?.note ?? '');
  const [growthOpen, setGrowthOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [interactionLine, setInteractionLine] = useState(() =>
    getContextLine(state.avatar.equipped.personality, {
      hour: new Date().getHours(), meals: todayMeals, waterMl: todayWaterMl, stars: todayStars, cheat: todayLog.isCheatDay,
    }),
  );

  useEffect(() => {
    if (phase !== 'breathing') return;
    const timer = window.setInterval(() => setSeconds((s) => {
      if (s <= 1) { window.clearInterval(timer); setPhase('choice'); return 0; }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const expNeed = expToNext(state.avatar.level);
  const starsToLevel = Math.max(1, Math.ceil((expNeed - state.avatar.exp) / 10));
  const waterClaimed = state.waterStarDates.includes(today);
  const moodClaimed = state.moodStarDates.includes(today);
  const starCapReached = todayEarned >= 9999;

  const refreshLine = () => {
    setInteractionLine(getContextLine(state.avatar.equipped.personality, {
      hour: new Date().getHours(), meals: todayMeals, waterMl: todayWaterMl, stars: todayStars, cheat: todayLog.isCheatDay,
    }));
    setLineSeed((s) => s + 1);
  };

  const addWater = () => {
    if (waterClaimed || starCapReached) { notify(starCapReached ? '今天星星已经赚满啦' : '今天的喝水星已经领过啦'); return; }
    dispatch({ type: 'ADD_WATER', date: today });
    notify(waterClaimed ? '又陪我喝了一杯' : '喝水打卡，收到一颗星');
    refreshLine();
  };

  const saveMood = () => {
    if (moodClaimed || starCapReached) { notify(starCapReached ? '今天星星已经赚满啦' : '今天的心情星已经领过啦'); setMoodOpen(false); return; }
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

  return (
    <div className="space-y-4 px-4 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">你的分身和星星都在这里</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight text-text">分身小屋</h1>
        </div>
        <span className="chip shrink-0 bg-yellowSoft text-xs font-medium text-yellowText"><Icon name="star" size={13} className="mr-1 inline text-yellowText" />今日 +{todayStars} 星</span>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="chip bg-surface px-2.5 py-1.5 text-[11px] text-text/75">Lv.{state.avatar.level} · {state.avatar.equipped.name}</span>
          <span className="text-[11px] text-textMuted">再赚 {starsToLevel} 星升级</span>
        </div>
        <div className="overflow-hidden rounded-[20px]">
          <button onClick={refreshLine} className="block w-full animate-idle" aria-label="和分身互动">
            <Avatar config={state.avatar.equipped} fill />
          </button>
        </div>
        <p key={lineSeed} className="mx-auto max-w-[280px] text-center text-sm leading-relaxed text-text/80 animate-pop-in">“{interactionLine}”</p>
        <div className="grid grid-cols-[1.5fr_1fr] gap-2">
          <Link to="/star-box" className="btn-primary text-center">
            <span className="inline-flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1.5"><Icon name="gift" size={16} />打开星星盒</span>
              <span className="text-[11px] font-normal">{state.blindBox.stars} 颗星可用</span>
            </span>
          </Link>
          <Link to="/wardrobe" className="btn-secondary flex items-center justify-center gap-1.5 ring-greenSoft"><Icon name="hanger" size={16} />去衣橱</Link>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center"><p className="mt-1 text-xl font-bold text-text">{state.blindBox.stars}</p><p className="muted">可用星星</p></div>
        <div className="card p-3 text-center"><p className="mt-1 text-xl font-bold text-text">{state.blindBox.fragments}/10</p><p className="muted">升级碎片</p></div>
        <div className="card p-3 text-center"><p className="mt-1 text-xl font-bold text-text">{state.streakDays}天</p><p className="muted">连续记录</p></div>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今天怎么赚星</h2>
          <span className={`text-[11px] ${starCapReached ? 'text-peachStrong' : 'text-yellowText'}`}>今日已赚 {todayEarned} 星</span>
        </div>
        <Link to="/record" className="flex items-center gap-3 rounded-2xl bg-surface p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-card text-primary"><Icon name="camera" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-text">记录一餐</span><span className="muted">拍照或手记都可以</span></span>
          <span className="chip bg-greenSoft px-2.5 py-1 text-[11px] text-primary">+1星</span>
        </Link>
        <button
          onClick={addWater}
          disabled={waterClaimed || starCapReached}
          className={`flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition-opacity ${waterClaimed || starCapReached ? 'opacity-50' : 'active:scale-[0.99]'}`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-card text-primary"><Icon name="cup" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-text">陪我喝一杯水</span><span className="muted">今天还没来 2 杯</span></span>
          <span className="chip bg-greenSoft px-2.5 py-1 text-[11px] text-primary">{starCapReached ? '已满' : waterClaimed ? '已领' : '+1星'}</span>
        </button>
        <button
          onClick={() => { setMood(todayMood?.mood ?? '开心'); setMoodNote(todayMood?.note ?? ''); setMoodOpen(true); }}
          disabled={moodClaimed || starCapReached}
          className={`flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition-opacity ${moodClaimed || starCapReached ? 'opacity-50' : 'active:scale-[0.99]'}`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-card text-primary"><Icon name="heart" size={18} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-text">记录今天的心情</span><span className="muted">{todayMood ? `今天：${todayMood.mood}` : '一句话也可以'}</span></span>
          <span className="chip bg-greenSoft px-2.5 py-1 text-[11px] text-primary">{starCapReached ? '已满' : moodClaimed ? '已领' : '+1星'}</span>
        </button>
        <button onClick={() => { setSeconds(60); setPhase('breathing'); }} className="flex w-full items-center justify-between rounded-2xl bg-peachSoft p-3 text-left active:scale-[0.99]">
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-card text-peachStrong"><Icon name="sparkle" size={18} /></span>
            <span><span className="block text-sm font-medium text-text">扛馋急救</span><span className="muted">陪自己慢慢呼吸一分钟</span></span>
          </span>
          <span className="chip bg-peachStrong px-3 py-1.5 text-[11px] text-primaryText">我现在好馋</span>
        </button>
        {phase !== 'idle' && (
          <div className="rounded-2xl bg-surface p-4 text-center">
            {phase === 'breathing' ? (
              <>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-primary/30 bg-greenSoft text-primary animate-breathe"><Icon name="sparkle" size={28} /></div>
                <p className="mt-3 text-sm text-text">慢慢吸气…呼气…</p>
                <p className="text-xl font-bold text-primary">{seconds}s</p>
                <button onClick={() => setPhase('choice')} className="muted underline">跳过等待</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => finishBreathing('resisted')} className="btn-primary text-xs">我停下来了</button>
                <button onClick={() => finishBreathing('ate')} className="btn-reward text-xs">吃了也没关系</button>
              </div>
            )}
          </div>
        )}
        <button onClick={() => setGrowthOpen(true)} className="w-full text-center text-xs text-primary">查看成长记录</button>
      </section>

      <Modal open={moodOpen} onClose={() => setMoodOpen(false)} title="记录今天的心情">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {moods.map((item) => <button key={item} onClick={() => setMood(item)} className={`chip text-xs ${mood === item ? 'bg-primary text-primaryText' : 'bg-surface text-textMuted'}`}>{item}</button>)}
          </div>
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
    </div>
  );
}
