import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { blindBoxItems } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxItemType } from '../types';
import { itemMeta } from '../utils/itemMeta';

type Category = 'hair' | 'outfit' | 'bottom' | 'shoes' | 'accessory' | 'hamster';

const BASE_UNLOCKED = ['bob', 'hoodie', 'shortsMix', 'sneaker'];

const hamsterDecor = [
  { id: 'hat', name: '小礼帽', emoji: '🎩', cost: 5 },
  { id: 'scarf', name: '软围巾', emoji: '🧣', cost: 5 },
  { id: 'leaf', name: '叶子发饰', emoji: '🍃', cost: 5 },
  { id: 'toy', name: '小摆件', emoji: '🏺', cost: 5 },
];

const categories: { id: Category; label: string }[] = [
  { id: 'hair', label: '发型' },
  { id: 'outfit', label: '上衣' },
  { id: 'bottom', label: '下装' },
  { id: 'shoes', label: '鞋子' },
  { id: 'accessory', label: '配饰' },
  { id: 'hamster', label: '仓鼠装饰' },
];

export default function WardrobePage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('outfit');
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar.equipped);

  const owned = state.blindBox.ownedItems;
  const pool = useMemo(() => blindBoxItems.filter((item) => item.type === category), [category]);
  const items = useMemo(() => {
    const seen = new Set<string>();
    return pool.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [pool]);

  const isEquipped = (id: string) => {
    const meta = itemMeta(id);
    return !!meta.field && draft[meta.field] === id;
  };

  const isUnlocked = (id: string) => owned.includes(id) || BASE_UNLOCKED.includes(id);

  const tryOn = (id: string) => {
    if (!isUnlocked(id)) {
      notify('这件还没解锁，去星星盒碰碰运气吧');
      return;
    }
    const field = itemMeta(id).field;
    if (!field) return;
    setDraft((current) => ({ ...current, [field]: id }));
    notify(`已换上「${itemMeta(id).name}」`);
  };

  const save = () => {
    dispatch({ type: 'SAVE_LOOK', look: { id: `look-${Date.now()}`, name: '我的搭配', config: draft } });
    if (state.unseenItems.length > 0) dispatch({ type: 'CLEAR_UNSEEN', ids: state.blindBox.ownedItems });
    notify('穿搭已保存，回到分身小屋啦');
    navigate('/avatar');
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-6">
      <SubPageHeader title="衣帽间" subtitle="点一下就能试穿" backTo="/avatar" />

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
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-2xl">{owned ? item.emoji : '🔒'}</span>
                  <span className="w-full truncate text-center text-xs font-medium text-text">{item.name}</span>
                  <button
                    onClick={() => {
                      if (owned) dispatch({ type: 'EQUIP_HAMSTER_DECOR', id: item.id });
                      else if (state.blindBox.stars >= item.cost) dispatch({ type: 'BUY_HAMSTER_DECOR', id: item.id, cost: item.cost });
                      else notify('星星不够，先去赚几颗吧');
                    }}
                    className={`chip w-full py-1.5 text-[11px] ${equipped ? 'bg-primary text-primaryText' : 'bg-surface text-text'}`}
                  >{equipped ? '✓ 已戴上' : owned ? '戴上' : `${item.cost} 星解锁`}</button>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const unlocked = isUnlocked(item.id);
            const equipped = isEquipped(item.id);
            return (
              <button
                key={item.id}
                onClick={() => tryOn(item.id)}
                className={`relative flex flex-col items-center gap-2 rounded-[20px] p-3 shadow-card transition-all active:scale-95 ${
                  equipped ? 'ring-2 ring-primary bg-greenSoft' : unlocked ? 'bg-card' : 'bg-surface opacity-50'
                }`}
              >
                {equipped && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primaryText"><Icon name="check" size={12} /></span>}
                <span className={`relative grid h-14 w-14 place-items-center rounded-2xl text-2xl ${unlocked ? 'bg-surface' : 'bg-surface grayscale opacity-60'}`}>
                  {unlocked ? item.emoji : '🔒'}
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-text">{unlocked ? item.name : '未解锁'}</span>
                <span className="muted">{unlocked ? (equipped ? '穿戴中' : '点击试穿') : '星星盒可得'}</span>
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
