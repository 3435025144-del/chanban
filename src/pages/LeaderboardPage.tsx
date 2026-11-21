import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/date';

export default function LeaderboardPage() {
  const { state, dispatch, notify } = useApp();
  const today = todayKey();
  const heartsFor = (id: string) => state.dailyRewardDates.filter((key) => key.startsWith(`heart-${id}-`)).length;
  const rows = [
    { id: 'me', name: state.avatar.equipped.name, tag: state.tasteProfile.flavors[0] ?? '慢慢吃饭', hearts: heartsFor('me'), days: state.streakDays, me: true },
    ...state.friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      tag: friend.note ?? '慢慢吃饭',
      hearts: heartsFor(friend.id),
      days: friend.streak ?? 0,
      me: false,
    })),
  ].sort((a, b) => b.hearts - a.hearts || b.days - a.days);

  return (
    <div className="av-page min-h-screen space-y-3 bg-page px-5 pb-32 pt-6">
      <SubPageHeader title="成长排行榜" subtitle="本周收到的赞 · 不比较体重和热量" backTo="/avatar" />

      <section className="card space-y-2">
        {rows.map((row, index) => {
          const liked = state.dailyRewardDates.includes(`heart-${row.id}-${today}`);
          const config = { ...state.avatar.equipped, name: row.name };
          return (
            <div key={row.id} className={`flex items-center gap-2 rounded-[18px] p-2 ${row.me ? 'bg-[#E4F0E4]' : ['bg-[#FFF4C7]', 'bg-[#F8E4E2]', 'bg-[#E3EEF2]', 'bg-surface'][index % 4]}`}>
              <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${index < 3 ? 'text-peachStrong' : 'text-textMuted'}`}>{index + 1}</span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[12px] bg-card"><Avatar config={config} size={40} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-text">{row.name}{row.me && <span className="ml-0.5 text-[10px] font-normal text-greenText">（我）</span>}</p>
                <span className="chip mt-0.5 inline-block bg-card px-1.5 py-0.5 text-[10px] text-text/70">{row.tag}</span>
              </div>
              <span className="w-[86px] shrink-0 text-left text-[11px] text-text/75 tabular-nums">已打卡 {row.days} 天</span>
              <button disabled={row.me || liked}
                onClick={() => { if (row.me) { notify('不能给自己点赞哦'); return; } if (liked) { notify('今天已经给 TA 点过赞啦，点赞不能撤回'); return; } dispatch({ type: 'SEND_HEART', id: row.id, date: today }); notify('本周收到的赞 +1'); }}
                className={`flex w-8 shrink-0 flex-col items-center ${row.me ? 'text-textFaint' : liked ? 'text-peachStrong opacity-70' : 'text-peachText'}`}
                aria-label={row.me ? '不能给自己点赞' : `给${row.name}点赞`}>
                <Icon name="heart" size={16} strokeWidth={liked ? 2.4 : 1.7} />
                <span className="text-[10px] tabular-nums">{liked ? 1 : 0}</span>
              </button>
            </div>
          );
        })}
        <p className="muted text-center text-[11px]">每周一清零，只记录小小的鼓励。</p>
      </section>
    </div>
  );
}
