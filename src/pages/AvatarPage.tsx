import { useEffect, useState } from 'react';
import Avatar, { equippedLabel } from '../components/Avatar';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import {
  accessoryOptions,
  actionOptions,
  backgroundOptions,
  faceOptions,
  hairOptions,
  outfitOptions,
  skinOptions,
} from '../data/avatarOptions';
import { getAvatarLine } from '../data/avatarLines';
import { findItem, itemsInPool, milestones } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxPool, DrawResult, Personality } from '../types';
import { drawItems, pullCost } from '../utils/blindBox';
import { expToNext } from '../utils/constants';
import { todayKey } from '../utils/date';

const personalityLabel: Record<Personality, string> = {
  gentle: '温柔鼓励型',
  sassy: '毒舌闺蜜型',
  funny: '搞笑型',
};

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

function OptionRow<T extends { id: string; label: string }>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink/75">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`chip text-xs ${value === option.id ? 'bg-coral text-white border-coral' : 'bg-white border-line text-ink/70'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvatarPage() {
  const { state, dispatch, limitedUnlocked } = useApp();
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar.equipped);
  const [lineSeed, setLineSeed] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'breathing' | 'choice'>('idle');
  const [seconds, setSeconds] = useState(60);
  const [pool, setPool] = useState<BlindBoxPool>('normal');
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<DrawResult[] | null>(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeTarget, setExchangeTarget] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setDraft(state.avatar.equipped), [state.avatar.equipped]);

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

  const line = getAvatarLine(draft.personality);
  const expNeed = expToNext(state.avatar.level);
  const expPercent = Math.min(100, Math.round((state.avatar.exp / expNeed) * 100));
  const owned = state.blindBox.ownedItems;
  const poolItems = itemsInPool(pool);
  const exchangeable = poolItems.filter((item) => !owned.includes(item.id));

  const startCraving = () => {
    setSeconds(60);
    setPhase('breathing');
  };

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

  const shareText = `我的分身「${state.avatar.equipped.name}」今日穿搭：${equippedLabel(state.avatar.equipped)}。和馋伴一起，开心记录每一餐～`;

  return (
    <div className="px-4 pt-6 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">我的分身</h1>
        <p className="muted mt-1">她永远站在你这边，不会皱眉头。</p>
      </div>

      <section className="card flex gap-3 items-center bg-gradient-to-br from-white to-peach/50">
        <Avatar config={state.avatar.equipped} size={112} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base truncate">{state.avatar.equipped.name}</h2>
            <span className="text-[10px] bg-coral text-white rounded-full px-2 py-0.5">Lv.{state.avatar.level}</span>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>经验值</span>
              <span>{state.avatar.exp}/{expNeed}</span>
            </div>
            <div className="h-2 rounded-full bg-peach overflow-hidden mt-1">
              <div className="h-full bg-mint rounded-full transition-all" style={{ width: `${expPercent}%` }} />
            </div>
          </div>
          <p className="text-xs text-coralDark">心情：{state.avatar.mood}</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">今天想跟你说</h2>
          <button onClick={() => setLineSeed((s) => s + 1)} className="text-xs text-coralDark">换一句 ↻</button>
        </div>
        <p key={lineSeed} className="text-sm leading-relaxed bg-cream rounded-xl p-3 animate-pop-in">“{line}”</p>
        <p className="muted text-right">—— {state.avatar.equipped.name}（{personalityLabel[draft.personality]}）</p>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">现在好馋？</h2>
        {phase === 'idle' && (
          <button onClick={startCraving} className="btn-primary w-full">🍬 我现在好馋，陪我一下</button>
        )}
        {phase === 'breathing' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-28 h-28 mx-auto rounded-full bg-mintSoft border-4 border-mint/40 flex items-center justify-center animate-breathe">
              <span className="text-4xl">🌬️</span>
            </div>
            <p className="text-sm">跟着圆圈慢慢吸气…呼气…</p>
            <p className="text-2xl font-bold text-coralDark">{seconds}s</p>
            <button onClick={() => setPhase('choice')} className="text-[11px] text-muted underline">
              演示模式：跳过等待
            </button>
          </div>
        )}
        {phase === 'choice' && (
          <div className="space-y-2">
            <p className="text-sm text-center">好啦，现在感觉怎么样？怎么选都被爱着。</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => finishCraving('resisted')} className="bg-mint text-white rounded-xl py-3 text-xs">
                忍住啦<br /><span className="opacity-80">+15 经验 · +1 星</span>
              </button>
              <button onClick={() => finishCraving('ate')} className="bg-peach text-coralDark rounded-xl py-3 text-xs">
                吃了也没关系<br /><span className="opacity-70">+5 经验 · +1 星</span>
              </button>
            </div>
          </div>
        )}
        <button onClick={() => dispatch({ type: 'EXERCISE' })} className="btn-ghost w-full text-xs">
          🏃 完成运动打卡（+20 经验 · +2 星）
        </button>
        <p className="muted">累计扛馋成功 {state.totalCravingsResisted} 次 · 运动 {state.totalExercise} 次</p>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">盲盒小屋</h2>
            <p className="muted mt-0.5">只奖励记录行为本身，不奖励少吃</p>
          </div>
          <div className="bg-peach rounded-full px-3 py-1.5 text-sm font-bold text-coralDark shrink-0">
            ⭐ {state.blindBox.stars}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['normal', 'limited'] as BlindBoxPool[]).map((p) => (
            <button
              key={p}
              onClick={() => setPool(p)}
              className={`rounded-xl py-2 text-xs border ${pool === p ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
            >
              {p === 'normal' ? '普通池' : limitedUnlocked ? '限定池 ✨' : '限定池 🔒'}
            </button>
          ))}
        </div>
        {pool === 'limited' && !limitedUnlocked && (
          <p className="text-[11px] text-muted">领取任意里程碑奖励后解锁限定池。</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => doPull(1)} disabled={pulling} className="btn-primary text-xs disabled:opacity-60">
            单抽 · 5 ⭐
          </button>
          <button onClick={() => doPull(10)} disabled={pulling} className="bg-mint text-white rounded-full py-2.5 text-xs font-medium disabled:opacity-60">
            十连 · 45 ⭐
          </button>
        </div>

        {pulling && (
          <div className="py-8 text-center space-y-2">
            <div className="text-5xl animate-shake inline-block">🎁</div>
            <p className="text-sm">正在拆开小礼物…</p>
          </div>
        )}

        {results && !pulling && (
          <div className="bg-cream rounded-xl p-3 space-y-2 animate-pop-in">
            <p className="text-xs font-semibold">拆到啦！</p>
            {results.length === 0 ? (
              <p className="text-xs text-muted">星星还不够，去记录一餐就能再来～</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {results.map((r, i) => {
                  const meta = metaOf(r.itemId);
                  return (
                    <div key={`${r.itemId}-${i}`} className="bg-white rounded-xl p-2 text-center text-[11px]">
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
            <button onClick={() => doPull(1)} className="btn-ghost w-full text-xs mt-1">再来一次 ↻</button>
          </div>
        )}

        <div className="border-t border-line pt-3 flex items-center justify-between">
          <p className="text-xs">🧩 碎片 <span className="font-bold text-coralDark">{state.blindBox.fragments}</span>/10</p>
          <button onClick={() => setExchangeOpen(true)} className="text-xs text-coralDark underline">去兑换</button>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">我的衣柜</h2>
          <button onClick={() => setShareOpen(true)} className="text-xs text-coralDark">今日穿搭卡片 →</button>
        </div>
        {owned.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">衣柜还空着，抽一次就有新朋友来啦。</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {owned.map((id) => {
              const meta = metaOf(id);
              const isOn = state.avatar.equipped[meta.type] === id;
              return (
                <button
                  key={id}
                  onClick={() => equip(id)}
                  className={`rounded-xl border p-2 text-center text-[11px] ${isOn ? 'border-coral bg-peach/60' : 'border-line bg-white'}`}
                >
                  <div className="text-2xl">{meta.emoji}</div>
                  <p className="mt-1 truncate">{meta.name}</p>
                  <p className={`mt-0.5 ${isOn ? 'text-coralDark font-semibold' : 'text-muted'}`}>{isOn ? '穿着中' : '点击穿戴'}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">里程碑必得</h2>
        {milestones.map((m) => {
          const current =
            m.metric === 'meals' ? state.totalMealsLogged : m.metric === 'streak' ? state.streakDays : state.totalCravingsResisted;
          const claimed = state.milestonesClaimed.includes(m.id);
          const ready = current >= m.target;
          return (
            <div key={m.id} className="bg-cream rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{m.title}</span>
                <span className="text-muted">{Math.min(current, m.target)}/{m.target}</span>
              </div>
              <div className="h-1.5 bg-peach rounded-full overflow-hidden">
                <div className="h-full bg-coral rounded-full" style={{ width: `${Math.min(100, (current / m.target) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted">奖励：{m.rewardName} 👕</p>
                <button
                  onClick={() => dispatch({ type: 'CLAIM_MILESTONE', id: m.id })}
                  disabled={!ready || claimed}
                  className={`text-[11px] rounded-full px-3 py-1 ${claimed ? 'bg-mintSoft text-mint' : ready ? 'bg-coral text-white' : 'bg-white text-muted border border-line'}`}
                >
                  {claimed ? '已领取' : ready ? '领取' : '继续加油'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">给分身换个样子</h2>
        <OptionRow title="脸型" options={faceOptions} value={draft.face} onChange={(face) => setDraft({ ...draft, face })} />
        <OptionRow title="发型" options={hairOptions} value={draft.hair} onChange={(hair) => setDraft({ ...draft, hair })} />
        <OptionRow title="肤色" options={skinOptions} value={draft.skin} onChange={(skin) => setDraft({ ...draft, skin })} />
        <OptionRow title="服装" options={outfitOptions} value={draft.outfit} onChange={(outfit) => setDraft({ ...draft, outfit })} />
        <OptionRow title="配饰" options={accessoryOptions} value={draft.accessory} onChange={(accessory) => setDraft({ ...draft, accessory })} />
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink/75">名字</p>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink/75">性格</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(personalityLabel) as Personality[]).map((p) => (
              <button
                key={p}
                onClick={() => setDraft({ ...draft, personality: p })}
                className={`rounded-xl py-2 text-[11px] border ${draft.personality === p ? 'bg-coral text-white border-coral' : 'bg-white border-line'}`}
              >
                {personalityLabel[p]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'UPDATE_AVATAR', patch: draft })}
          className="btn-primary w-full text-sm"
        >
          保存，让分身换新装
        </button>
      </section>

      <Modal open={exchangeOpen} onClose={() => setExchangeOpen(false)} title="碎片兑换">
        <div className="space-y-3 text-sm">
          <p>当前碎片 {state.blindBox.fragments} 个，10 个可换池内任意指定物品。</p>
          <select
            value={exchangeTarget}
            onChange={(e) => setExchangeTarget(e.target.value)}
            className="w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="">请选择想要的物品</option>
            {exchangeable.map((item) => (
              <option key={item.id} value={item.id}>{item.emoji} {item.name}（{item.pool === 'normal' ? '普通池' : '限定池'}）</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!exchangeTarget || state.blindBox.fragments < 10) return;
              dispatch({ type: 'EXCHANGE', itemId: exchangeTarget });
              setExchangeOpen(false);
              setExchangeTarget('');
            }}
            className="btn-primary w-full text-xs"
          >
            用 10 个碎片兑换
          </button>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="今日穿搭">
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-peach to-cream rounded-2xl p-4 flex gap-3 items-center">
            <Avatar config={state.avatar.equipped} size={120} />
            <div>
              <p className="font-bold">{state.avatar.equipped.name}</p>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">{equippedLabel(state.avatar.equipped)}</p>
              <p className="text-[11px] text-coralDark mt-2">Lv.{state.avatar.level} · {state.avatar.mood}</p>
            </div>
          </div>
          <p className="text-xs text-muted">截图保存，或复制文案分享给朋友。</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(shareText).then(() => setCopied(true)).catch(() => setCopied(false));
            }}
            className="btn-ghost w-full text-xs"
          >
            {copied ? '已复制 ✓' : '复制穿搭文案'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
