import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { itemsInPool } from '../data/blindBoxItems';
import type { BlindBoxPool, DrawResult } from '../types';
import { drawItems, pullCost } from '../utils/blindBox';

const rarityLabel = { common: '常见', rare: '稀有', epic: '珍藏' } as const;
const rarityWeight = { common: 6, rare: 3, epic: 1 } as const;

export default function StarBoxPage() {
  const { state, dispatch, limitedUnlocked, notify } = useApp();
  const navigate = useNavigate();
  const [pool, setPool] = useState<BlindBoxPool>('normal');
  const [pulling, setPulling] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeTarget, setExchangeTarget] = useState('');

  const poolItems = itemsInPool(pool);
  const exchangeable = poolItems.filter((item) => !state.blindBox.ownedItems.includes(item.id));
  const totalWeight = poolItems.reduce((sum, item) => sum + rarityWeight[item.rarity], 0);
  const probabilities = (Object.keys(rarityLabel) as (keyof typeof rarityLabel)[]).map((rarity) => {
    const count = poolItems.filter((item) => item.rarity === rarity).length;
    return { rarity, count, percent: totalWeight ? Math.round((count * rarityWeight[rarity] / totalWeight) * 100) : 0 };
  });

  const choosePool = (next: BlindBoxPool) => {
    if (next === 'limited' && !limitedUnlocked) {
      notify('领一份成长礼物后，限定盒就会打开');
      return;
    }
    setPool(next);
  };

  const doPull = (count: 1 | 10) => {
    if (pulling) return;
    const cost = pullCost(count);
    if (state.blindBox.stars < cost) {
      notify(`还差 ${cost - state.blindBox.stars} 颗星，去记一餐就有啦`);
      return;
    }
    setPulling(true);
    const results: DrawResult[] = drawItems(state.blindBox.ownedItems, pool, count);
    notify(count === 1 ? '星星盒摇了摇…' : '十连盒摇得真热闹…');
    window.setTimeout(() => {
      dispatch({ type: 'RESOLVE_PULL', results, cost });
      setPulling(false);
      navigate('/draw-result');
    }, 900);
  };

  const exchange = () => {
    if (state.blindBox.fragments < 10) {
      notify('还差一点碎片，重复款会变成碎片哦');
      return;
    }
    if (!exchangeTarget) {
      notify('先选一个想要的礼物');
      return;
    }
    dispatch({ type: 'EXCHANGE', itemId: exchangeTarget });
    setExchangeOpen(false);
    setExchangeTarget('');
    notify('兑换成功，去看看吧');
    navigate('/draw-result');
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <SubPageHeader title="星星盒" subtitle="把照顾自己的小事，换成一份小礼物" backTo="/avatar" />

      <section className="card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-avocadoSoft text-avocado"><Icon name="star" size={19} /></span>
          <span>
            <span className="block text-xs text-muted">可用星星</span>
            <span className="block text-lg font-bold text-ink">{state.blindBox.stars}</span>
          </span>
        </div>
        <div className="h-8 w-px bg-line" />
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-coralSoft text-coral"><Icon name="gift" size={19} /></span>
          <span>
            <span className="block text-xs text-muted">碎片</span>
            <span className="block text-lg font-bold text-ink">{state.blindBox.fragments}/10</span>
          </span>
        </div>
      </section>

      <section className="card-important space-y-4 text-center">
        <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-[32px] bg-avocadoSoft">
          <span className="absolute inset-3 rounded-[26px] border border-dashed border-avocado/50" />
          <Icon name="gift" size={64} className={`relative text-avocado ${pulling ? 'animate-shake' : 'animate-idle'}`} />
          {hasUnseen() && (
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-coral ring-2 ring-white" />
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-ink">{pulling ? '正在拆开…' : '今天要拆哪一盒？'}</p>
          <p className="muted mt-1">重复款会变成碎片，碎片能换指定礼物。</p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-warm p-1">
          {(['normal', 'limited'] as BlindBoxPool[]).map((item) => (
            <button
              key={item}
              onClick={() => choosePool(item)}
              className={`rounded-2xl py-2 text-xs transition-colors active:scale-95 ${
                pool === item ? 'bg-white font-semibold text-avocado shadow-card' : 'text-muted'
              }`}
            >
              {item === 'normal' ? '日常盒' : limitedUnlocked ? '限定盒' : '限定盒 · 未解锁'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => doPull(1)}
            disabled={pulling}
            className={`btn-primary ${state.blindBox.stars < 5 ? 'opacity-60' : ''}`}
          >
            单抽 · 5 星
          </button>
          <button
            onClick={() => doPull(10)}
            disabled={pulling}
            className={`btn-reward ${state.blindBox.stars < 45 ? 'opacity-60' : ''}`}
          >
            十连 · 45 星
          </button>
        </div>
        <Link to="/record" className="block text-xs text-avocado underline">星星不够？去记录一餐</Link>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">这一盒里有什么</h2>
        <div className="space-y-2">
          {probabilities.map((item) => (
            <div key={item.rarity} className="flex items-center gap-3 rounded-2xl bg-warm px-3 py-2.5">
              <span className="text-xs font-medium text-ink">{rarityLabel[item.rarity]}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-avocado" style={{ width: `${item.percent}%` }} />
              </div>
              <span className="w-16 text-right text-[11px] text-muted">{item.count} 款 · {item.percent}%</span>
            </div>
          ))}
        </div>
        <button onClick={() => setExchangeOpen(true)} className="btn-secondary w-full">
          <span className="inline-flex items-center gap-1.5"><Icon name="wallet" size={16} />碎片兑换指定款</span>
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">最近收到的星星</h2>
        {state.starLedger.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted">还没有记录，今天从一颗星开始吧。</p>
        ) : (
          <div className="space-y-2">
            {state.starLedger.slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-warm px-3 py-2.5 text-xs">
                <span className="text-ink/80">{entry.reason}</span>
                <span className="font-semibold text-avocado">+{entry.amount}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={exchangeOpen} onClose={() => setExchangeOpen(false)} title="碎片兑换">
        <div className="space-y-3">
          <p className="muted leading-relaxed">当前 {state.blindBox.fragments} 个碎片，每 10 个可以换这一盒里指定一款。</p>
          <select
            value={exchangeTarget}
            onChange={(e) => setExchangeTarget(e.target.value)}
            className="w-full rounded-2xl bg-warm px-3 py-2.5 text-sm text-ink outline-none"
          >
            <option value="">选一个想要的礼物</option>
            {exchangeable.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>)}
          </select>
          {exchangeable.length === 0 && <p className="text-xs text-muted">这一盒已经收齐啦，去另一盒看看。</p>}
          <button onClick={exchange} className="btn-primary w-full">用 10 个碎片兑换</button>
        </div>
      </Modal>
    </div>
  );

  function hasUnseen() {
    return state.unseenItems.length > 0;
  }
}
