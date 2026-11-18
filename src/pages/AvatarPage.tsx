import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar, { equippedLabel } from '../components/Avatar';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { accessoryOptions, backgroundOptions, hairOptions, outfitOptions } from '../data/avatarOptions';
import { getAvatarLine } from '../data/avatarLines';
import { findItem, itemsInPool, milestones } from '../data/blindBoxItems';
import type { BlindBoxPool, DrawResult } from '../types';
import { drawItems, pullCost } from '../utils/blindBox';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

interface Meta {
  name: string;
  emoji: string;
  type: 'outfit' | 'hair' | 'accessory' | 'background' | 'action';
}

function metaOf(id: string): Meta {
  const item = findItem(id);
  if (item) return { name: item.name, emoji: item.emoji, type: item.type };
  const outfit = outfitOptions.find((o) => o.id === id);
  if (outfit) return { name: outfit.label, emoji: '👕', type: 'outfit' };
  const hair = hairOptions.find((o) => o.id === id);
  if (hair) return { name: hair.label, emoji: '💇', type: 'hair' };
  const acc = accessoryOptions.find((o) => o.id === id);
  if (acc) return { name: acc.label, emoji: '🎀', type: 'accessory' };
  const bg = backgroundOptions.find((o) => o.id === id);
  if (bg) return { name: bg.label, emoji: '🌈', type: 'background' };
  return { name: id, emoji: '🎁', type: 'outfit' };
}

export default function AvatarPage() {
  const { state, dispatch, limitedUnlocked } = useApp();
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [pool, setPool] = useState<BlindBoxPool>('normal');
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<DrawResult[] | null>(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeTarget, setExchangeTarget] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineSeed, setLineSeed] = useState(0);

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
  const owned = state.blindBox.ownedItems;
  const poolItems = itemsInPool(pool);
  const exchangeable = poolItems.filter((item) => !owned.includes(item.id));
  const avatarLine = getAvatarLine(state.avatar.equipped.personality);
  const shareText = `我的分身「${state.avatar.equipped.name}」今日穿搭：${equippedLabel(state.avatar.equipped)}。和馋伴一起，开心记录每一餐～`;

  const finishCraving = (result: 'resisted' | 'ate') => {
    dispatch({ type: 'CRAVING', result, date: todayKey() });
    setPhase('idle');
  };

  const doPull = (count: 1 | 10) => {
    const cost = pullCost(count);
    if (state.blindBox.stars < cost) {
      setResults([]);
      return;
    }
    setPulling(true);
    setResults(null);
    const drawn = drawItems(owned, pool, count);
    window.setTimeout(() => {
      dispatch({ type: 'RESOLVE_PULL', results: drawn, cost });
      setResults(drawn);
      setPulling(false);
    }, 1200);
  };

  const equip = (id: string) => {
    const meta = metaOf(id);
    dispatch({ type: 'EQUIP', field: meta.type, itemId: id });
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div>
        <p className="muted">你的分身和星星都在这里</p>
        <h1 className="text-2xl font-bold mt-1">分身小屋</h1>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-avocadoSoft to-white p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-avocadoDark">⭐ {state.blindBox.stars}</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-coralDark">🧩 {state.blindBox.fragments}</span>
          </div>
          <button onClick={() => setShareOpen(true)} className="text-xs text-avocadoDark">穿搭卡片 →</button>
        </div>
        <div className="flex flex-col items-center mt-1">
          <button key={lineSeed} onClick={() => setLineSeed((s) => s + 1)} className="animate-float">
            <Avatar config={state.avatar.equipped} size={220} />
          </button>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="font-bold text-lg">{state.avatar.equipped.name}</h2>
            <span className="text-[10px] bg-avocado text-white rounded-full px-2 py-0.5">Lv.{state.avatar.level}</span>
          </div>
          <div className="w-full max-w-[240px] mt-2">
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div className="h-full bg-avocado rounded-full" style={{ width: `${expPercent}%` }} />
            </div>
            <p className="muted text-center mt-1">经验 {state.avatar.exp}/{expNeed} · 心情 {state.avatar.mood}</p>
          </div>
          <p key={`line-${lineSeed}`} className="text-sm text-center mt-3 animate-pop-in">“{avatarLine}”</p>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="section-title">盲盒小屋</h2>
          <p className="muted mt-1">只奖励记录行为本身，不奖励少吃。</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['normal', 'limited'] as BlindBoxPool[]).map((p) => (
            <button key={p} onClick={() => setPool(p)} className={`rounded-2xl py-2 text-xs ${pool === p ? 'bg-avocado text-white' : 'bg-cream text-muted'}`}>
              {p === 'normal' ? '普通池' : limitedUnlocked ? '限定池 ✨' : '限定池 🔒'}
            </button>
          ))}
        </div>
        {pool === 'limited' && !limitedUnlocked && <p className="muted">领取任意里程碑奖励后解锁。</p>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => doPull(1)} disabled={pulling} className="bg-avocado text-white rounded-3xl py-5 font-semibold shadow-pop disabled:opacity-60">
            <span className="block text-2xl mb-1">🎁</span>单抽 · 5 ⭐
          </button>
          <button onClick={() => doPull(10)} disabled={pulling} className="bg-coral text-white rounded-3xl py-5 font-semibold disabled:opacity-60">
            <span className="block text-2xl mb-1">🎁</span>十连 · 45 ⭐
          </button>
        </div>
        {pulling && <div className="text-center text-5xl animate-shake py-6">🎁</div>}
        {results && !pulling && (
          <div className="bg-cream rounded-3xl p-3 space-y-2 animate-pop-in">
            <p className="text-xs font-semibold">拆到啦！</p>
            {results.length === 0 ? (
              <p className="text-xs text-muted">星星还不够，去记录一餐就能再来～</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {results.map((r, i) => {
                  const meta = metaOf(r.itemId);
                  return (
                    <div key={`${r.itemId}-${i}`} className="bg-white rounded-2xl p-2 text-center text-[11px]">
                      <div className="text-2xl">{meta.emoji}</div>
                      <p className="font-medium mt-1">{meta.name}</p>
                      <p className={r.isDuplicate ? 'text-coralDark' : 'text-muted'}>
                        {r.isDuplicate ? '变成碎片啦，离想要的更近一步' : '新朋友加入衣柜！'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => doPull(1)} className="btn-ghost w-full text-xs">再来一次 ↻</button>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line/60 pt-3">
          <p className="text-xs">🧩 碎片 {state.blindBox.fragments}/10</p>
          <button onClick={() => setExchangeOpen(true)} className="text-xs text-avocadoDark">去兑换</button>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">今日赚星任务</h2>
        <Link to="/record" className="flex items-center gap-3 bg-cream rounded-3xl p-3">
          <span className="text-2xl">🍽️</span>
          <div className="flex-1">
            <p className="text-sm font-medium">记录三餐</p>
            <p className="muted">拍照或手记都可以，每餐 +1 星</p>
          </div>
          <span className="text-avocadoDark">→</span>
        </Link>
        <div className="bg-cream rounded-3xl p-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍬</span>
            <div className="flex-1">
              <p className="text-sm font-medium">扛馋急救</p>
              <p className="muted">60 秒呼吸引导，完成后 +1 星</p>
            </div>
          </div>
          {phase === 'idle' && (
            <button onClick={() => { setSeconds(60); setPhase('breathing'); }} className="w-full bg-avocado text-white rounded-full py-2.5 text-xs">
              我现在好馋
            </button>
          )}
          {phase === 'breathing' && (
            <div className="text-center space-y-3 py-2">
              <div className="w-24 h-24 mx-auto rounded-full bg-avocadoSoft border-4 border-avocado/30 grid place-items-center animate-breathe">
                <span className="text-3xl">🌬️</span>
              </div>
              <p className="text-sm">慢慢吸气…呼气…</p>
              <p className="text-xl font-bold text-avocadoDark">{seconds}s</p>
              <button onClick={() => setPhase('choice')} className="text-[11px] text-muted underline">演示模式：跳过等待</button>
            </div>
          )}
          {phase === 'choice' && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => finishCraving('resisted')} className="bg-avocado text-white rounded-2xl py-2.5 text-[11px]">忍住啦<br />+15 经验 · +1 星</button>
              <button onClick={() => finishCraving('ate')} className="bg-coral text-white rounded-2xl py-2.5 text-[11px]">吃了也没关系<br />+5 经验 · +1 星</button>
            </div>
          )}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">我的衣柜</h2>
          <Link to="/settings" className="text-xs text-avocadoDark">换形象 →</Link>
        </div>
        {owned.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">衣柜还空着，抽一次就有新朋友来啦。</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {owned.map((id) => {
              const meta = metaOf(id);
              const isOn = state.avatar.equipped[meta.type] === id;
              return (
                <button key={id} onClick={() => equip(id)} className={`rounded-2xl p-2 text-center text-[11px] ${isOn ? 'bg-avocadoSoft' : 'bg-cream'}`}>
                  <div className="text-2xl">{meta.emoji}</div>
                  <p className="mt-1 truncate">{meta.name}</p>
                  <p className={isOn ? 'text-avocadoDark font-semibold' : 'text-muted'}>{isOn ? '穿着中' : '点击穿戴'}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">里程碑必得</h2>
        {milestones.map((m) => {
          const current = m.metric === 'meals' ? state.totalMealsLogged : m.metric === 'streak' ? state.streakDays : state.totalCravingsResisted;
          const claimed = state.milestonesClaimed.includes(m.id);
          const ready = current >= m.target;
          return (
            <div key={m.id} className="bg-cream rounded-2xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{m.title}</span>
                <span className="text-muted">{Math.min(current, m.target)}/{m.target}</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-avocado rounded-full" style={{ width: `${Math.min(100, current / m.target * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted">奖励：{m.rewardName}</p>
                <button onClick={() => dispatch({ type: 'CLAIM_MILESTONE', id: m.id })} disabled={!ready || claimed} className={`text-[11px] rounded-full px-3 py-1 ${claimed ? 'bg-mint text-avocadoDark' : ready ? 'bg-avocado text-white' : 'bg-white text-muted'}`}>
                  {claimed ? '已领取' : ready ? '领取' : '继续加油'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <Modal open={exchangeOpen} onClose={() => setExchangeOpen(false)} title="碎片兑换">
        <div className="space-y-3 text-sm">
          <p>当前碎片 {state.blindBox.fragments} 个，10 个可换池内任意指定物品。</p>
          <select value={exchangeTarget} onChange={(e) => setExchangeTarget(e.target.value)} className="w-full bg-cream rounded-2xl px-3 py-2 text-sm outline-none">
            <option value="">请选择想要的物品</option>
            {exchangeable.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>)}
          </select>
          <button onClick={() => { if (!exchangeTarget || state.blindBox.fragments < 10) return; dispatch({ type: 'EXCHANGE', itemId: exchangeTarget }); setExchangeOpen(false); setExchangeTarget(''); }} className="btn-primary w-full text-xs">
            用 10 个碎片兑换
          </button>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="今日穿搭">
        <div className="space-y-3">
          <div className="rounded-3xl bg-gradient-to-br from-avocadoSoft to-peach p-4 flex gap-3 items-center">
            <Avatar config={state.avatar.equipped} size={110} />
            <div>
              <p className="font-bold">{state.avatar.equipped.name}</p>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">{equippedLabel(state.avatar.equipped)}</p>
              <p className="text-[11px] text-avocadoDark mt-2">Lv.{state.avatar.level} · {state.avatar.mood}</p>
            </div>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(shareText).then(() => setCopied(true)).catch(() => setCopied(false)); }} className="btn-ghost w-full text-xs">
            {copied ? '已复制 ✓' : '复制穿搭文案'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
