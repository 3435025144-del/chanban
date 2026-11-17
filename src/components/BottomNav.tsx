import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/record', label: '记录', icon: '📝' },
  { to: '/avatar', label: '分身', icon: '🧸' },
  { to: '/me', label: '我的', icon: '🌼' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] z-30 bg-white/95 backdrop-blur border-t border-line px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 text-[11px] transition-colors ${
                isActive ? 'text-coralDark font-semibold' : 'text-muted'
              }`
            }
          >
            <span className="text-[21px] leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
