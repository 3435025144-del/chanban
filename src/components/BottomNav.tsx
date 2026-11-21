import { NavLink } from 'react-router-dom';
import Icon, { type IconName } from './Icon';

const leftTabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/record', label: '首页', icon: 'home' },
  { to: '/trend', label: '趋势', icon: 'trend' },
];
const rightTabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/avatar', label: '小馋', icon: 'avatar' },
  { to: '/me', label: '我的', icon: 'user' },
];

interface Props {
  onRecord: () => void;
}

export default function BottomNav({ onRecord }: Props) {
  const renderTab = (tab: { to: string; label: string; icon: IconName }) => (
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
  );

  return (
    <nav className="rb-nav" aria-label="主导航">
      <div className="rb-nav-inner">
        {leftTabs.map(renderTab)}
        <button type="button" onClick={onRecord} className="rb-nav-record" aria-label="打开记录中心">
          <span className="rb-nav-record-circle"><Icon name="camera" size={25} strokeWidth={2.1} /></span>
          <span className="rb-nav-record-label">记录</span>
        </button>
        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
