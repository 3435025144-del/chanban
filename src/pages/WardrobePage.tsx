import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { blindBoxItems } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxItemType } from '../types';
import { itemMeta } from '../utils/itemMeta';

type Category = 'hair' | 'outfit' | 'bottom' | 'shoes' | 'accessory';

const categories: { id: Category; label: string }[] = [
  { id: 'hair', label: '发型' },
  { id: 'outfit', label: '上衣' },
  { id: 'bottom', label: '下装' },
  { id: 'shoes', label: '鞋子' },
  { id: 'accessory', label: '配饰' },
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

  const tryOn = (id: string) => {
    if (!owned.includes(id)) {
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

      <section className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] bg-card py-4 shadow-card">
        <div className="rounded-[20px] bg-surface p-2">
          <Avatar config={draft} size={230} className="animate-idle" />
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

        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const unlocked = owned.includes(item.id);
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
                <span className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl ${unlocked ? 'bg-surface' : 'bg-border grayscale'}`}>{item.emoji}</span>
                <span className="w-full truncate text-center text-xs font-medium text-text">{unlocked ? item.name : '未解锁'}</span>
                <span className="muted">{unlocked ? (equipped ? '穿戴中' : '点击试穿') : '星星盒可得'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2 px-4">
        <button onClick={save} className="btn-primary w-full">保存穿搭</button>
      </div>
    </div>
  );
}
