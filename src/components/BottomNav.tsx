import { NavLink } from 'react-router-dom';
import Icon, { type IconName } from './Icon';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/record', label: '记录', icon: 'record' },
  { to: '/trend', label: '趋势', icon: 'trend' },
  { to: '/avatar', label: '小馋', icon: 'avatar' },
  { to: '/me', label: '我的', icon: 'user' },
];

export default function BottomNav() {
  return (
    <nav className="rb-nav" aria-label="主导航">
      <div className="rb-nav-inner">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} aria-label={tab.label} className="rb-nav-link">
            {({ isActive }) => (
              <>
                <span className={`rb-nav-circle ${isActive ? 'rb-nav-circle-active' : ''}`}>
                  <Icon name={tab.icon} size={19} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                <span className={`rb-nav-label ${isActive ? 'rb-nav-label-active' : ''}`}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
