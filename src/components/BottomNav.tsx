import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Icon, { type IconName } from './Icon';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/eat', label: '吃什么', icon: 'eat' },
  { to: '/record', label: '记录', icon: 'record' },
  { to: '/avatar', label: '分身', icon: 'avatar' },
  { to: '/me', label: '我的', icon: 'user' },
];

export default function BottomNav() {
  const { state } = useApp();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[375px] -translate-x-1/2 bg-card/95 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur" aria-label="主导航">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-label={tab.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[10px] transition-all duration-150 active:scale-95 ${
                isActive ? 'font-semibold text-primary' : 'text-textMuted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative grid h-9 w-9 place-items-center rounded-2xl transition-colors ${isActive ? 'bg-primary text-primaryText shadow-card' : 'bg-transparent'}`}>
                  <Icon name={tab.icon} size={20} strokeWidth={isActive ? 2 : 1.7} />
                  {tab.to === '/avatar' && !state.guideSeen && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-peachStrong ring-2 ring-card" />
                  )}
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
