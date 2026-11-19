import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar, { equippedLabel } from '../components/Avatar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { getContextLine } from '../data/avatarLines';
import { milestones } from '../data/blindBoxItems';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

export default function AvatarPage() {
  const {
    state,
    dispatch,
    todayLog,
    todayWaterMl,
    todayMeals,
    todayStars,
    hasUnseenReward,
    notify,
  } = useApp();
  const today = todayKey();
  const [lineSeed, setLineSeed] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [interactionLine, setInteractionLine] = useState(() =>
    getContextLine(state.avatar.equipped.personality, {
      hour: new Date().getHours(),
      meals: todayMeals,
      waterMl: todayWaterMl,
      stars: todayStars,
      cheat: todayLog.isCheatDay,
    }),
  );

  useEffect(() => {
    if (phase !== 'breathing') return;
    const timer = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          setPhase('choice');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const expNeed = expToNext(state.avatar.level);
  const expPercent = Math.min(100, Math.round((state.avatar.exp / expNeed) * 100));
  const cheerClaimed = state.dailyCheerDates.includes(today);
  const waterClaimed = state.waterStarDates.includes(today);
  const walkClaimed = state.walkStarDates.includes(today);

  const refreshLine = () => {
    setInteractionLine(
      getContextLine(state.avatar.equipped.personality, {
        hour: new Date().getHours(),
        meals: todayMeals,
        waterMl: todayWaterMl,
        stars: todayStars,
        cheat: todayLog.isCheatDay,
      }),
    );
    setLineSeed((s) => s + 1);
  };

  const claimCheer = () => {
    if (cheerClaimed) {
      notify('今天的星星已经收下啦');
      return;
    }
    dispatch({ type: 'CLAIM_CHEER', date: today });
    notify('收下一颗星，谢谢你今天来找我');
    refreshLine();
  };

  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(waterClaimed ? '又陪我喝了一杯' : '喝水打卡，收到一颗星');
    refreshLine();
  };

  const walk = () => {
    dispatch({ type: 'ADD_STEPS', date: today, steps: 600 });
    notify(walkClaimed ? '又走了一段，舒服就好' : '走完十分钟，收到一颗星');
    refreshLine();
  };

  const finishBreathing = (result: 'resisted' | 'ate') => {
    dispatch({ type: 'CRAVING', result, date: today });
    setPhase('idle');
    setSeconds(60);
    notify(result === 'resisted' ? '你陪自己停下来了，收到一颗星' : '吃了也没关系，照样收到一颗星');
    refreshLine();
  };

  const shareText = `我的分身「${state.avatar.equipped.name}」今日穿搭：${equippedLabel(state.avatar.equipped)}。和馋伴一起，开心记录每一餐～`;
  const copyShare = () => {
    if (!navigator.clipboard) {
      notify('当前环境不支持复制，文案已显示在卡片里');
      return;
    }
    navigator.clipboard
      .writeText(shareText)
      .then(() => { setCopied(true); notify('穿搭文案已复制'); })
      .catch(() => notify('复制失败，可以手动选择文字'));
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <header>
        <p className="muted">你的分身和星星都在这里</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">分身小屋</h1>
      </header>

      <section className="card-important space-y-3">
        <div className="flex items-center justify-between">
          <span className="chip bg-warm text-xs text-avocadoInk">Lv.{state.avatar.level} · {state.avatar.equipped.name}</span>
          <span className="chip bg-coralSoft text-xs text-coralInk">今日 +{todayStars} 星</span>
        </div>
        <button onClick={refreshLine} className="mx-auto block py-1 animate-idle" aria-label="和分身互动">
          <Avatar config={state.avatar.equipped} size={220} />
        </button>
        <p key={lineSeed} className="mx-auto max-w-[280px] text-center text-sm leading-relaxed text-ink/80 animate-pop-in">
          “{interactionLine}”
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link to="/star-box" className="btn-primary relative text-center">
            <span className="inline-flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5"><Icon name="gift" size={17} />打开星星盒</span>
              <span className="text-[11px] font-normal opacity-80">{state.blindBox.stars} 颗星可用</span>
            </span>
            {hasUnseenReward && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-coral ring-2 ring-white" />}
          </Link>
          <Link to="/wardrobe" className="btn-secondary text-center">
            <span className="inline-flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5"><Icon name="hanger" size={17} />去衣橱</span>
              <span className="text-[11px] font-normal">{state.blindBox.ownedItems.length} 件已拥有</span>
            </span>
          </Link>
        </div>
        <button onClick={() => setShareOpen(true)} className="w-full text-center text-xs text-avocadoInk active:opacity-70">
          看看今日穿搭卡片
        </button>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="muted">星星</p>
          <p className="mt-1 text-lg font-bold text-ink">{state.blindBox.stars}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="muted">碎片</p>
          <p className="mt-1 text-lg font-bold text-ink">{state.blindBox.fragments}/10</p>
        </div>
        <div className="card p-3 text-center">
          <p className="muted">连续记录</p>
          <p className="mt-1 text-lg font-bold text-ink">{state.streakDays}天</p>
        </div>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今天怎么赚星</h2>
          <span className="muted">只奖励照顾自己的小事</span>
        </div>
        <Link to="/record" className="flex items-center gap-3 rounded-2xl bg-warm p-3 active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="camera" size={18} /></span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">记录一餐</span>
            <span className="muted">拍照或手记都可以</span>
          </span>
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
        <button onClick={addWater} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="cup" size={18} /></span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">陪我喝一杯水</span>
            <span className="muted">{waterClaimed ? '今天已经领过水杯星啦' : '记一杯水，+1 星'}</span>
          </span>
          <Icon name={waterClaimed ? 'check' : 'plus'} size={16} className="text-avocadoInk" />
        </button>
        <button onClick={walk} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="walk" size={18} /></span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">和我走十分钟</span>
            <span className="muted">{walkClaimed ? '今天的散步星已到账' : '完成后 +1 星'}</span>
          </span>
          <Icon name={walkClaimed ? 'check' : 'plus'} size={16} className="text-avocadoInk" />
        </button>
        <button onClick={claimCheer} className="flex w-full items-center gap-3 rounded-2xl bg-warm p-3 text-left active:scale-[0.99]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-avocadoInk"><Icon name="star" size={18} /></span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">收下今日星星</span>
            <span className="muted">{cheerClaimed ? '今天已经收下啦' : '只是来见我一面，也值得'}</span>
          </span>
          <Icon name={cheerClaimed ? 'check' : 'plus'} size={16} className="text-avocadoInk" />
        </button>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="section-title">陪自己呼吸一分钟</h2>
          <p className="muted mt-1">不管最后有没有吃，结果都一样被接住。</p>
        </div>
        {phase === 'idle' && (
          <button onClick={() => { setSeconds(60); setPhase('breathing'); }} className="btn-secondary w-full">我现在有点想吃东西</button>
        )}
        {phase === 'breathing' && (
          <div className="space-y-3 py-2 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-avocado/30 bg-avocadoSoft text-avocadoInk animate-breathe">
              <Icon name="sparkle" size={30} />
            </div>
            <p className="text-sm text-ink">慢慢吸气…呼气…</p>
            <p className="text-xl font-bold text-avocadoInk">{seconds}s</p>
            <button onClick={() => setPhase('choice')} className="text-[11px] text-muted underline">跳过等待</button>
          </div>
        )}
        {phase === 'choice' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => finishBreathing('resisted')} className="btn-primary px-2 text-xs">我停下来了</button>
            <button onClick={() => finishBreathing('ate')} className="btn-reward px-2 text-xs">吃了也没关系</button>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">成长记录</h2>
          <span className="muted">Lv.{state.avatar.level}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-avocado" style={{ width: `${expPercent}%` }} />
        </div>
        <p className="muted">经验 {state.avatar.exp}/{expNeed} · 心情 {state.avatar.mood}</p>
        <div className="space-y-2">
          {milestones.map((milestone) => {
            const current =
              milestone.metric === 'meals'
                ? state.totalMealsLogged
                : milestone.metric === 'streak'
                  ? state.streakDays
                  : state.totalCravingsResisted;
            const claimed = state.milestonesClaimed.includes(milestone.id);
            const ready = current >= milestone.target;
            return (
              <div key={milestone.id} className="flex items-center justify-between gap-2 rounded-2xl bg-warm px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink">{milestone.title}</p>
                  <p className="muted">{Math.min(current, milestone.target)}/{milestone.target} · {milestone.rewardName}</p>
                </div>
                <button
                  onClick={() => {
                    if (claimed || !ready) return;
                    dispatch({ type: 'CLAIM_MILESTONE', id: milestone.id });
                    notify(`成长礼物「${milestone.rewardName}」已放进衣橱`);
                  }}
                  disabled={claimed || !ready}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] ${
                    claimed ? 'bg-white text-muted' : ready ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'
                  }`}
                >
                  {claimed ? '已领取' : ready ? '领取' : '进行中'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="今日穿搭">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-[20px] bg-avocadoSoft p-3">
            <Avatar config={state.avatar.equipped} size={110} />
            <div className="min-w-0">
              <p className="font-semibold text-ink">{state.avatar.equipped.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/75">{equippedLabel(state.avatar.equipped)}</p>
              <p className="mt-2 text-[11px] text-avocadoInk">Lv.{state.avatar.level} · {state.avatar.mood}</p>
            </div>
          </div>
          <p className="rounded-2xl bg-warm p-3 text-xs leading-relaxed text-ink/75">{shareText}</p>
          <button onClick={copyShare} className="btn-secondary w-full">{copied ? '已复制 ✓' : '复制穿搭文案'}</button>
        </div>
      </Modal>
    </div>
  );
}
