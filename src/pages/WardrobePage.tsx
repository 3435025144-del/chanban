import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { DEFAULT_EQUIPPED } from '../utils/constants';
import {
  accessoryOptions,
  actionOptions,
  backgroundOptions,
  bottomOptions,
  hairOptions,
  outfitOptions,
  shoesOptions,
} from '../data/avatarOptions';
import { blindBoxItems } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxItemType } from '../types';
import { itemMeta, typeIcon } from '../utils/itemMeta';

type Category = 'hair' | 'outfit' | 'bottom' | 'shoes' | 'accessory' | 'background' | 'action' | 'hamster';

interface WardrobeItem { id: string; name: string; type: BlindBoxItemType; field?: keyof AvatarConfig; emoji: string }

const categories: { id: Category; label: string }[] = [
  { id: 'outfit', label: '上衣' },
  { id: 'bottom', label: '下装' },
  { id: 'shoes', label: '鞋子' },
  { id: 'hair', label: '发型' },
  { id: 'accessory', label: '配饰' },
  { id: 'background', label: '场景' },
  { id: 'action', label: '动作' },
  { id: 'hamster', label: '鼠鼠装饰' },
];

const hamsterDecor = [
  { id: 'hat', name: '小礼帽', emoji: '🎩', cost: 5 },
  { id: 'scarf', name: '软围巾', emoji: '🧣', cost: 5 },
  { id: 'leaf', name: '叶子发饰', emoji: '🍃', cost: 5 },
  { id: 'toy', name: '小摆件', emoji: '🏺', cost: 5 },
];

const baseItems: WardrobeItem[] = [
  ...outfitOptions.map((o) => ({ id: o.id, name: o.label, type: 'outfit' as const, field: 'outfit' as const, emoji: '👕' })),
  ...bottomOptions.map((o) => ({ id: o.id, name: o.label, type: 'bottom' as const, field: 'bottom' as const, emoji: '🩳' })),
  ...shoesOptions.map((o) => ({ id: o.id, name: o.label, type: 'shoes' as const, field: 'shoes' as const, emoji: '👟' })),
  ...hairOptions.filter((o) => o.id !== 'none').map((o) => ({ id: o.id, name: o.label, type: 'hair' as const, field: 'hair' as const, emoji: '💇' })),
  ...accessoryOptions.filter((o) => o.id !== 'none').map((o) => ({ id: o.id, name: o.label, type: 'accessory' as const, field: 'accessory' as const, emoji: '🎀' })),
  ...backgroundOptions.map((o) => ({ id: o.id, name: o.label, type: 'background' as const, field: 'background' as const, emoji: '🌈' })),
  ...actionOptions.filter((o) => o.id !== 'none').map((o) => ({ id: o.id, name: o.label, type: 'action' as const, field: 'action' as const, emoji: '✨' })),
];

const emojiFor = (item: WardrobeItem) => item.emoji || itemMeta(item.id).emoji;

const equipFields = ['outfit', 'bottom', 'shoes', 'hair', 'accessory', 'background', 'action'] as const;

function sanitizeEquipped(config: AvatarConfig, owned: string[]): AvatarConfig {
  const next = { ...config };
  equipFields.forEach((field) => {
    const value = next[field];
    if (value && value !== 'none' && !owned.includes(value)) {
      (next as Record<string, unknown>)[field] = (DEFAULT_EQUIPPED as Record<string, unknown>)[field];
    }
  });
  return next;
}

export default function WardrobePage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('outfit');
  const [draft, setDraft] = useState<AvatarConfig>(() => sanitizeEquipped(state.avatar.equipped, state.blindBox.ownedItems));

  const items = useMemo(() => {
    const special = blindBoxItems
      .filter((b) => b.type === category || (b.type === 'look' && category === 'outfit'))
      .map((b) => ({ id: b.id, name: b.name, type: b.type, field: itemMeta(b.id).field, emoji: b.emoji }));
    const base = baseItems.filter((item) => item.type === category);
    const seen = new Set<string>();
    return [...special, ...base].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [category]);

  const isUnlocked = (item: WardrobeItem) => state.blindBox.ownedItems.includes(item.id);

  const isEquipped = (item: WardrobeItem) => {
    if (!item.field || !isUnlocked(item)) return false;
    return (draft as Record<string, unknown>)[item.field] === item.id;
  };

  const tryOn = (item: WardrobeItem) => {
    if (!isUnlocked(item)) {
      notify('尚未解锁哦，去抽盲盒看看运气吧～');
      return;
    }
    if (!item.field) { notify('这是一套整装，穿戴中请到分身里查看'); return; }
    setDraft((current) => ({ ...current, [item.field]: item.id }));
    notify(`已换上「${item.name}」`);
  };

  const save = () => {
    dispatch({ type: 'SAVE_LOOK', look: { id: `look-${Date.now()}`, name: '我的搭配', config: draft } });
    if (state.unseenItems.length > 0) dispatch({ type: 'CLEAR_UNSEEN', ids: state.blindBox.ownedItems });
    notify('穿搭已保存，回到分身小屋啦');
    navigate('/avatar');
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-40 pt-6">
      <SubPageHeader title="衣帽间" subtitle="已解锁的随便穿，未解锁的去星星盒碰运气" backTo="/avatar" />

      <section className="flex flex-col items-center justify-center rounded-[24px] bg-card p-3 shadow-card">
        <div className="w-full overflow-hidden rounded-[20px]">
          <Avatar config={draft} fill className="animate-idle" />
        </div>
        <p className="mt-3 text-sm font-medium text-text">{state.avatar.equipped.name} · 试穿中</p>
      </section>

      <section className="mt-4 space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`chip shrink-0 text-xs ${category === item.id ? 'bg-primary text-primaryText shadow-card' : 'bg-surface text-textMuted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {category === 'hamster' ? (
          <div className="grid grid-cols-3 gap-2">
            {hamsterDecor.map((item) => {
              const owned = state.hamsterDecorOwned.includes(item.id);
              const equipped = state.hamsterDecorEquipped === item.id;
              return (
                <div key={item.id} className={`flex flex-col items-center gap-2 rounded-[20px] p-3 shadow-card ${equipped ? 'bg-greenSoft' : 'bg-card'}`}>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-2xl">{item.emoji}</span>
                  <span className="w-full truncate text-center text-xs font-medium text-text">{item.name}</span>
                  <button
                    onClick={() => {
                      if (owned) dispatch({ type: 'EQUIP_HAMSTER_DECOR', id: item.id });
                      else if (state.blindBox.stars >= item.cost) dispatch({ type: 'BUY_HAMSTER_DECOR', id: item.id, cost: item.cost });
                      else notify('星星不够，先去赚几颗吧');
                    }}
                    className={`chip w-full py-1.5 text-[11px] ${equipped ? 'bg-primary text-primaryText' : owned ? 'bg-surface text-text' : 'bg-yellowSoft text-text'}`}
                  >{equipped ? '✓ 已戴上' : owned ? '戴上' : `${item.cost} 星解锁`}</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              const locked = !isUnlocked(item);
              const equipped = isEquipped(item);
              return (
                <button
                  key={item.id}
                  onClick={() => tryOn(item)}
                  className={`relative flex flex-col items-center gap-2 rounded-[20px] p-3 shadow-card transition-all active:scale-95 ${
                    equipped ? 'ring-2 ring-primary bg-greenSoft' : locked ? 'wardrobe-card-locked' : 'bg-card'
                  }`}
                >
                  {equipped && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primaryText"><Icon name="check" size={12} /></span>}
                  <span className={`relative grid h-14 w-14 place-items-center rounded-2xl ${locked ? 'wardrobe-locked-icon' : 'bg-surface text-2xl'}`}>
                    {locked
                      ? <Icon name={typeIcon(item.type)} size={30} strokeWidth={1.8} />
                      : <span className="text-2xl">{emojiFor(item)}</span>}
                    {locked && <span className="wardrobe-lock-badge">🔒</span>}
                  </span>
                  <span className="w-full truncate text-center text-xs font-medium text-text">{item.name}</span>
                  <span className="muted">{equipped ? '穿戴中' : locked ? '盲盒可得' : '点击试穿'}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2 px-4">
        <button onClick={save} className="btn-primary w-full">保存穿搭</button>
      </div>
    </div>
  );
}
