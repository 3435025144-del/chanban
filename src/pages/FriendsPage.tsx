import { useState } from 'react';
import Avatar from '../components/Avatar';
import BottomSheet from '../components/BottomSheet';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import type { Friend, FriendPrivacy } from '../types';
import { todayKey } from '../utils/date';

const themes = [
  { key: '本周主题 · 清爽绿', label: '清爽绿' },
  { key: '本周主题 · 暖暖桃', label: '暖暖桃' },
  { key: '本周主题 · 天空蓝', label: '天空蓝' },
];
const friendLooks = ['粉色蝴蝶结', '奶蓝小裙子', '薄荷绿卫衣', '奶油色针织', '樱桃发夹', '云朵短靴'];
const friendSigns = ['慢慢吃饭，慢慢长大～', '今天也要开心呀 ✨', '好好生活，认真干饭', '和小馋一起变更好 🌿'];
const cardTints = ['fr-card-white', 'fr-card-pink', 'fr-card-green'];

export default function FriendsPage() {
  const { state, dispatch, notify } = useApp();
  const today = todayKey();
  const [friendCode, setFriendCode] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [sentStars, setSentStars] = useState<string[]>([]);
  const [starBurst, setStarBurst] = useState<string | null>(null);
  const [detailFriend, setDetailFriend] = useState<Friend | null>(null);
  const [message, setMessage] = useState('');

  const equipped = state.avatar.equipped;
  const avatarFor = (friend: Friend, size = 56) => (
    <Avatar
      size={size}
      config={{ ...equipped, name: friend.name, personality: 'gentle', accessory: 'none' }}
    />
  );

  const addFriend = () => {
    const code = friendCode.trim();
    if (!code) { notify('先输入好友码吧'); return; }
    dispatch({ type: 'ADD_FRIEND', friend: { id: `friend-${Date.now()}`, code, name: `好友 ${code.slice(-4)}` } });
    setFriendCode('');
    notify('好友已添加，等 TA 同步后就在这里了');
  };

  const shareCode = async () => {
    const code = `CHANBAN-${equipped.name}-${state.blindBox.stars}`;
    try { await navigator.clipboard.writeText(`来馋伴找我：${code}`); notify('好友码已复制'); }
    catch { notify(`我的好友码：${code}`); }
  };

  const sendStar = (friend: Friend) => {
    if (sentStars.includes(friend.id)) return;
    setSentStars((list) => [...list, friend.id]);
    setStarBurst(friend.id);
    window.setTimeout(() => setStarBurst(null), 600);
    notify(`给 ${friend.name} 送了一颗星星 ⭐`);
  };

  const openDetail = (friend: Friend) => {
    setMessage('');
    setDetailFriend(friend);
  };

  const photoRecords = Object.values(state.logs).flatMap((log) => log.records).filter((record) => record.source === 'photo' && record.imageDataUrl);

  return (
    <div className="av-page min-h-screen space-y-4 bg-page px-5 pb-32 pt-6">
      <SubPageHeader title="好友与穿搭" subtitle="不比较体重和热量，只交换好心情" backTo="/avatar" right={<button onClick={() => setPrivacyOpen(true)} className="text-[11px] text-primary">隐私设置</button>} />

      <section className="fr-theme-card">
        <p className="text-[13px] font-bold text-[#7a6a3a]">本周主题 · 一起换装</p>
        <div className="mt-3 flex gap-2">
          {themes.map((theme) => (
            <button key={theme.key} onClick={() => { dispatch({ type: 'SET_FRIEND_THEME', theme: theme.key }); notify('主题换好啦'); }}
              className={`fr-theme-pill ${state.friendTheme === theme.key ? 'fr-theme-pill-active' : ''}`}>
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex gap-2">
          <input value={friendCode} onChange={(e) => setFriendCode(e.target.value)} placeholder="输入好友码" className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
          <button onClick={addFriend} className="shrink-0 rounded-2xl bg-[#1A1A1A] px-5 text-[13px] font-bold text-white">添加</button>
        </div>
        <button onClick={shareCode} className="fr-share-btn">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface"><Icon name="copy" size={18} /></span>
          <span>分享我的穿搭 / 好友码</span>
          <Icon name="chevronRight" size={17} className="ml-auto text-textMuted" />
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-extrabold text-text">我的好友</h2>
          <span className="text-[11px] text-textMuted">{state.friends.length} 位搭子</span>
        </div>
        {state.friends.length === 0 && (
          <div className="rounded-[20px] bg-white px-4 py-10 text-center shadow-card">
            <span className="text-3xl">🐹</span>
            <p className="mt-2 text-[13px] text-textMuted">还没有好友，输入好友码添加一个吧～</p>
          </div>
        )}
        {state.friends.map((friend, index) => {
          const sent = sentStars.includes(friend.id);
          const look = friendLooks[index % friendLooks.length];
          return (
            <div key={friend.id} className={`fr-friend-card ${cardTints[index % cardTints.length]}`}>
              <div className="relative flex-none">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[20px] bg-white/70">{avatarFor(friend, 56)}</div>
                <span className="fr-look-tag">{look}</span>
              </div>
              <button onClick={() => openDetail(friend)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[15px] font-extrabold text-text">{friend.name}</p>
                <p className="mt-1 truncate text-[12px] font-medium text-[#5a5a5a]">今天穿了「{look}」</p>
                <p className="mt-1.5 text-[11px] text-textMuted">
                  <span className="text-[#E0A800]">⭐ {friend.stars ?? 41}</span>
                  <span className="mx-2 text-[#D8D8DC]">·</span>
                  <span className="text-[#F0803C]">🔥 连续 {friend.streak ?? 9} 天</span>
                </p>
              </button>
              <div className="relative flex-none">
                <button onClick={() => sendStar(friend)} disabled={sent} className={`fr-star-btn ${sent ? 'fr-star-sent' : ''}`} aria-label={`给${friend.name}送星星`}>
                  <span className="text-xl leading-none">⭐</span>
                </button>
                {starBurst === friend.id && <span className="fr-star-burst">+1</span>}
              </div>
            </div>
          );
        })}
      </section>

      <BottomSheet
        open={!!detailFriend}
        onClose={() => setDetailFriend(null)}
        eyebrow="好友穿搭"
        title={detailFriend ? `${detailFriend.name}的一天` : ''}
        footer={
          <div className="flex gap-2 pb-1">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="给 TA 留句话吧～" className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3 text-sm text-text outline-none" />
            <button onClick={() => { if (message.trim()) { notify('留言已送达 💌'); setMessage(''); } }} className="btn-primary shrink-0 px-5 text-xs">发送</button>
          </div>
        }
      >
        {detailFriend && (
          <div className="space-y-4 pb-4">
            <div className="flex flex-col items-center rounded-[22px] bg-greenSoft/40 p-4">
              <Avatar config={{ ...equipped, name: detailFriend.name, personality: 'gentle', accessory: 'none' }} size={130} />
              <p className="mt-2 text-[15px] font-extrabold text-text">{detailFriend.name}</p>
              <p className="mt-1 text-center text-[12px] text-textMuted">{friendSigns[state.friends.findIndex((f) => f.id === detailFriend.id) % friendSigns.length]}</p>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-bold text-text">今天穿的盲盒衣服</p>
              <div className="flex items-center gap-2 rounded-[18px] bg-surface p-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl">🎀</span>
                <span className="text-[13px] font-semibold text-text">{friendLooks[state.friends.findIndex((f) => f.id === detailFriend.id) % friendLooks.length]}</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-bold text-text">最近记录的一道美食</p>
              {photoRecords.length > 0 ? (
                <img src={photoRecords[0].imageDataUrl} alt={photoRecords[0].name} className="h-40 w-full rounded-[18px] object-cover" />
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-[18px] bg-surface">
                  <Hamster size={48} mood="cheer" />
                  <p className="mt-1 text-[12px] text-textMuted">TA 还没拍下美食，改天一起吃～</p>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="好友隐私设置">
        <div className="space-y-2">
          {([['open', '公开', '所有人都可以看到我的穿搭'], ['friends', '仅好友', '只有好友能看到我的穿搭'], ['private', '私密', '只有我自己能看到']] as [FriendPrivacy, string, string][]).map(([id, label, desc]) => (
            <button key={id} onClick={() => { dispatch({ type: 'SET_FRIEND_PRIVACY', privacy: id }); setPrivacyOpen(false); notify(`已设为${label}`); }}
              className={`flex w-full items-center justify-between rounded-2xl p-3 text-left ${state.friendPrivacy === id ? 'bg-greenSoft' : 'bg-surface'}`}>
              <span><span className="block text-sm font-bold text-text">{label}</span><span className="muted">{desc}</span></span>
              {state.friendPrivacy === id && <Icon name="check" size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
