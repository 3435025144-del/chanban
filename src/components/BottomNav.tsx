import { NavLink } from 'react-router-dom';
import Icon, { type IconName } from './Icon';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/record', label: '记录', icon: 'record' },
  { to: '/avatar', label: '小馋', icon: 'avatar' },
  { to: '/me', label: '我的', icon: 'user' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card/95 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur" aria-label="主导航">
      <div className="grid grid-cols-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-label={tab.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] transition-all duration-150 active:scale-95 ${
                isActive ? 'font-semibold text-primary' : 'text-textMuted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative grid h-9 w-9 place-items-center rounded-2xl transition-colors ${isActive ? 'bg-primary text-primaryText shadow-card' : 'bg-transparent'}`}>
                  <Icon name={tab.icon} size={20} strokeWidth={isActive ? 2 : 1.7} />
                </span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
