import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { itemMeta, typeLabel } from '../utils/itemMeta';

const rarityLabel = { common: '常见', rare: '稀有', epic: '珍藏' } as const;

export default function DrawResultPage() {
  const { state } = useApp();
  const results = state.lastBoxResult;
  const newItemId = state.lastBoxNewItemId;

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <SubPageHeader title="拆到啦" subtitle="每一份都是分身的小礼物" backTo="/star-box" />

      {!results || results.length === 0 ? (
        <section className="card space-y-4 py-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-surface text-textMuted"><Icon name="gift" size={30} /></span>
          <div>
            <p className="text-base font-semibold text-text">还没有拆开的礼物</p>
            <p className="muted mt-1">先去记录几件小事，攒几颗星吧。</p>
          </div>
          <Link to="/star-box" className="btn-primary inline-block">去星星盒</Link>
        </section>
      ) : (
        <>
          <section className="card-important space-y-4 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-peachSoft text-peachStrong animate-pop-in">
              <Icon name="gift" size={46} />
            </div>
            <div>
              <p className="text-lg font-bold text-text">今天的好运在这里</p>
              <p className="muted mt-1">{results.length === 1 ? '一份新礼物来到你身边' : `${results.length} 份礼物一起到啦`}</p>
            </div>

            {results.length === 1 ? (
              (() => {
                const result = results[0];
                const meta = itemMeta(result.itemId);
                return (
                  <div className="rounded-[20px] bg-surface p-4">
                    <span className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-card text-3xl">{meta.emoji}</span>
                    <p className="mt-3 text-base font-semibold text-text">{meta.name}</p>
                    <p className="muted mt-1">{typeLabel(meta.type)} · {rarityLabel[meta.rarity]} · {meta.series}</p>
                    <p className="mt-2 text-xs leading-relaxed text-text/75">{meta.desc}</p>
                    <p className={`mt-3 text-xs font-medium ${result.isDuplicate ? 'text-peachStrong' : 'text-primary'}`}>
                      {result.isDuplicate ? '重复款变成 1 个碎片，离想要的更近了' : '新朋友加入衣柜！'}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-2 gap-2 text-left">
                {results.map((result, i) => {
                  const meta = itemMeta(result.itemId);
                  const isNew = !result.isDuplicate || result.itemId === newItemId;
                  return (
                    <div key={`${result.itemId}-${i}`} className={`rounded-2xl p-2.5 ${isNew ? 'bg-greenSoft' : 'bg-surface'}`}>
                      <div className="flex items-center justify-between">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-lg">{meta.emoji}</span>
                        <span className={`text-[10px] ${result.isDuplicate ? 'text-peachStrong' : 'text-primary'}`}>
                          {result.isDuplicate ? '碎片 +1' : '新款'}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-xs font-semibold text-text">{meta.name}</p>
                      <p className="muted">{typeLabel(meta.type)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card space-y-3">
            <p className="text-sm leading-relaxed text-text/80">
              重复款不会白费，已经变成 {results.filter((r) => r.isDuplicate).length} 个碎片。现在共有 {state.blindBox.fragments} 个碎片。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/wardrobe" className="btn-primary text-center">去衣橱试穿</Link>
              <Link to="/avatar" className="btn-secondary text-center">回分身小屋</Link>
            </div>
            <Link to="/star-box" className="block text-center text-xs text-primary underline">再开一盒</Link>
          </section>
        </>
      )}
    </div>
  );
}
