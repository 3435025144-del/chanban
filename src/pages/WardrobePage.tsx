import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar, { equippedLabel } from '../components/Avatar';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { blindBoxItems } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxItemType } from '../types';
import { isLookItem, itemMeta, lookConfigFor, typeIcon, typeLabel } from '../utils/itemMeta';

type Filter = 'all' | BlindBoxItemType;

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'outfit', label: '上装' },
  { id: 'bottom', label: '下装' },
  { id: 'shoes', label: '鞋子' },
  { id: 'hair', label: '发型' },
  { id: 'accessory', label: '配饰' },
  { id: 'background', label: '场景' },
  { id: 'action', label: '动作' },
  { id: 'look', label: '整套' },
];

export default function WardrobePage() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AvatarConfig>(state.avatar.equipped);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(state.lastBoxNewItemId ?? null);
  const favoriteId = useMemo(() => `favorite-${Date.now()}`, []);
  const favoriteLooks = state.favoriteLooks;

  const owned = state.blindBox.ownedItems;
  const visibleItems = filter === 'all' ? owned : owned.filter((id) => itemMeta(id).type === filter);
  const lockedItems = blindBoxItems.filter((item) => !owned.includes(item.id)).slice(0, 4);
  const isFavorite = favoriteLooks.some((look) => look.id === favoriteId);

  const tryOn = (id: string) => {
    const meta = itemMeta(id);
    const look = lookConfigFor(id);
    const field = meta.field;
    if (field) {
      setDraft((current) => ({ ...current, [field]: id }));
    } else if (isLookItem(id) && look) {
      setDraft((current) => ({ ...current, ...look }));
    } else {
      notify('这套搭配还在准备中');
      return;
    }
    setSelectedId(id);
    notify(`已让分身试穿「${meta.name}」`);
  };

  const saveLook = (destination: '/avatar' | '/') => {
    dispatch({
      type: 'SAVE_LOOK',
      look: { id: selectedId ?? `look-${Date.now()}`, name: '我的搭配', config: draft },
    });
    if (state.unseenItems.length > 0) {
      dispatch({ type: 'CLEAR_UNSEEN', ids: state.blindBox.ownedItems });
    }
    notify('搭配已保存，可以回去炫耀啦');
    navigate(destination);
  };

  const toggleFavorite = () => {
    dispatch({ type: 'TOGGLE_FAVORITE_LOOK', id: favoriteId, config: draft });
    notify(isFavorite ? '已取消收藏' : '这套搭配收进收藏啦');
  };

  const applyFavorite = (config: AvatarConfig) => {
    setDraft(config);
    setSelectedId(null);
    notify('收藏的搭配已经穿上啦');
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <SubPageHeader
        title="我的衣橱"
        subtitle="点一下试穿，满意了再保存"
        backTo="/avatar"
        right={<span className="chip shrink-0 bg-warm text-xs text-avocadoInk">{owned.length} 件</span>}
      />

      <section className="card-important space-y-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {owned.map((id) => {
            const meta = itemMeta(id);
            const active = selectedId === id;
            const isNew = state.unseenItems.includes(id);
            return (
              <button
                key={id}
                onClick={() => tryOn(id)}
                className={`card relative w-[76px] shrink-0 p-2 text-center active:scale-95 ${active ? 'ring-2 ring-avocado' : ''}`}
              >
                {isNew && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-coral ring-2 ring-white" />}
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl">{meta.emoji}</span>
                <span className="mt-1.5 block truncate text-[11px] font-medium text-ink">{meta.name}</span>
                <span className="muted block truncate">{active ? '试穿中' : typeLabel(meta.type)}</span>
              </button>
            );
          })}
        </div>
        <Avatar config={draft} size={220} className="mx-auto block animate-idle" />
        <p className="text-center text-sm font-medium text-ink">{state.avatar.equipped.name}</p>
        <p className="muted text-center leading-relaxed">{equippedLabel(draft)}</p>
        <button onClick={toggleFavorite} className="btn-secondary w-full">
          <span className="inline-flex items-center justify-center gap-1.5"><Icon name={isFavorite ? 'check' : 'heart'} size={16} />{isFavorite ? '已收藏这套' : '收藏这套'}</span>
        </button>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">全部分类</h2>
          <Link to="/star-box" className="text-xs text-avocadoInk">去凑新衣服 →</Link>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`chip shrink-0 text-xs ${filter === item.id ? 'bg-avocado text-avocadoInk' : 'bg-white text-muted'}`}
            >
              {item.id === 'all' ? item.label : (
                <span className="inline-flex items-center gap-1"><Icon name={typeIcon(item.id)} size={13} />{item.label}</span>
              )}
            </button>
          ))}
        </div>
        {visibleItems.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">这一类还没有衣服，去星星盒看看。</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visibleItems.map((id) => {
              const meta = itemMeta(id);
              const active = selectedId === id;
              return (
                <button
                  key={id}
                  onClick={() => tryOn(id)}
                  className={`rounded-2xl p-2 text-center transition-colors active:scale-95 ${active ? 'bg-avocadoSoft' : 'bg-warm'}`}
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-white text-lg">{meta.emoji}</span>
                  <span className="mt-1.5 block truncate text-[11px] font-medium text-ink">{meta.name}</span>
                  <span className="muted block truncate">{active ? '试穿中 · 再点一次' : '点击试穿'}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {favoriteLooks.length > 0 && (
        <section className="card space-y-3">
          <h2 className="section-title">收藏的搭配</h2>
          <div className="space-y-2">
            {favoriteLooks.slice(-3).map((look) => (
              <button key={look.id} onClick={() => applyFavorite(look.config)} className="flex w-full items-center justify-between gap-2 rounded-2xl bg-warm px-3 py-2.5 text-left active:scale-[0.99]">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-ink">{look.name}</span>
                  <span className="muted block truncate">{equippedLabel(look.config)}</span>
                </span>
                <Icon name="hanger" size={16} className="shrink-0 text-avocadoInk" />
              </button>
            ))}
          </div>
        </section>
      )}

      {lockedItems.length > 0 && (
        <section className="card space-y-3">
          <h2 className="section-title">还想要这些？</h2>
          <div className="grid grid-cols-4 gap-2">
            {lockedItems.map((item) => (
              <Link key={item.id} to="/star-box" className="rounded-2xl bg-warm p-2 text-center opacity-70 active:scale-95">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-white text-lg">{item.emoji}</span>
                <span className="mt-1 block truncate text-[10px] text-ink">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => saveLook('/')} className="btn-primary">保存并回首页</button>
        <button onClick={() => saveLook('/avatar')} className="btn-secondary">保存并回分身</button>
      </div>
    </div>
  );
}
