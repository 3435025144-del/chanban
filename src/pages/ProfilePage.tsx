import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { state } = useApp();
  const stats = [
    { label: '连续记录', value: `${state.streakDays} 天`, icon: '🌱' },
    { label: '累计记录', value: `${state.totalMealsLogged} 餐`, icon: '🍽️' },
    { label: '扛馋成功', value: `${state.totalCravingsResisted} 次`, icon: '🍬' },
    { label: '当前等级', value: `Lv.${state.avatar.level}`, icon: '⭐' },
    { label: '星星余额', value: `${state.blindBox.stars}`, icon: '✨' },
    { label: '碎片数量', value: `${state.blindBox.fragments}`, icon: '🧩' },
  ];

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div>
        <p className="muted">你的小小成就都在这里</p>
        <h1 className="text-2xl font-bold mt-1">我的</h1>
      </div>

      <section className="rounded-3xl bg-avocado text-white p-5 flex items-center gap-4 shadow-pop">
        <div className="bg-white/20 rounded-3xl p-1">
          <Avatar config={state.avatar.equipped} size={96} />
        </div>
        <div>
          <h2 className="font-bold text-lg">{state.avatar.equipped.name}</h2>
          <p className="text-xs text-white/80 mt-1">Lv.{state.avatar.level} · {state.avatar.mood}</p>
          <p className="text-[11px] text-white/70 mt-2">谢谢你一直温柔地照顾自己。</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">成就数据</h2>
          <span className="muted">只记录，不评判</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-cream rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted">{stat.label}</p>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p className="text-xl font-bold text-avocadoDark mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <Link to="/settings" className="card flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">偏好设置</p>
          <p className="muted mt-0.5">热量目标、身高、分身形象与性格</p>
        </div>
        <span className="text-avocadoDark">→</span>
      </Link>

      <section className="rounded-3xl bg-coral/15 p-4">
        <p className="text-sm font-medium">馋伴的小约定</p>
        <p className="text-xs text-ink/70 mt-2 leading-relaxed">
          吃放纵餐也能被喜欢，如实记录本身就是值得庆祝的事。这里的奖励只增不减，分身永远不会因为你而受苦。
        </p>
      </section>
    </div>
  );
}
