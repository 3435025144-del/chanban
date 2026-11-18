import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '首页', icon: '🏡' },
  { to: '/eat', label: '吃什么', icon: '🥑' },
  { to: '/record', label: '记录', icon: '📝' },
  { to: '/avatar', label: '分身', icon: '🧸' },
  { to: '/me', label: '我的', icon: '🌿' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] z-30 bg-white/95 backdrop-blur rounded-t-3xl shadow-card px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 text-[10px] transition-colors ${
                isActive ? 'text-avocadoDark font-semibold' : 'text-muted'
              }`
            }
          >
            <span className={`text-[20px] leading-none ${tab.to === '/record' ? 'bg-avocado text-white rounded-full w-10 h-10 grid place-items-center -mt-5 mb-0.5 shadow-pop' : ''}`}>
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
