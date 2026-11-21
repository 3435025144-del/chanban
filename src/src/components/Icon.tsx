import type { ReactNode } from 'react';

export type IconName =
  | 'home' | 'eat' | 'record' | 'avatar' | 'user'
  | 'back' | 'close' | 'check' | 'plus' | 'chevronDown' | 'chevronLeft' | 'chevronRight'
  | 'camera' | 'search' | 'cup' | 'walk' | 'gift' | 'hanger' | 'calendar'
  | 'edit' | 'trash' | 'arrowRight' | 'sparkle' | 'wallet' | 'clock' | 'chart'
  | 'bell' | 'shield' | 'info' | 'settings' | 'copy' | 'external' | 'undo'
  | 'heart' | 'filter' | 'shirt' | 'scissors' | 'palette' | 'list' | 'star' | 'pin';

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.7 }: Props) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M4 10.5 12 4l8 6.5V20H4z" /><path d="M9.5 20v-6h5v6" /></>,
    eat: <><path d="M7 3v8a2 2 0 0 0 4 0V3" /><path d="M9 3v18" /><path d="M17 3c-2 2-3 5-3 9h5V3z" /><path d="M16.5 12v9" /></>,
    record: <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></>,
    avatar: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-4 3.5-6 7-6s6.2 2 7 6" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-4 3.5-6 7-6s6.2 2 7 6" /></>,
    back: <path d="M15 5 8 12l7 7" />,
    close: <path d="M6 6 18 18M18 6 6 18" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronLeft: <path d="m15 5-7 7 7 7" />,
    chevronRight: <path d="m9 5 7 7-7 7" />,
    camera: <><path d="M4 8h4l1.5-2h5L16 8h4v11H4z" /><circle cx="12" cy="13" r="3.2" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    cup: <><path d="M6 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M8 4v2M12 4v2" /></>,
    walk: <><circle cx="13" cy="4" r="1.6" /><path d="m10 21 2-6-3-3 2-5 4 3 3 1" /><path d="m12 15 4 6" /></>,
    gift: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M4 14h16M12 10v10" /><path d="M8.5 10C6 9 7 5 9.5 6S12 10 12 10s1-3 3.5-4S18 9 15.5 10" /></>,
    hanger: <><path d="M12 6a2 2 0 1 1 2 2c-1 0-2 1-2 2" /><path d="m12 10 8 5H4z" /></>,
    calendar: <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M8 3v6M16 3v6M4 11h16" /></>,
    edit: <><path d="m14 5 5 5-9 9H5v-5z" /><path d="m12 7 5 5" /></>,
    trash: <><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></>,
    arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
    sparkle: <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
    wallet: <><rect x="4" y="6" width="16" height="13" rx="2" /><path d="M4 10h16M16 14h2" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    chart: <><path d="M5 19V9M12 19V5M19 19v-7" /></>,
    bell: <><path d="M6 16h12l-2-3V9a4 4 0 0 0-8 0v4z" /><path d="M10 19h4" /></>,
    shield: <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6z" />,
    info: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 16V5h11" /></>,
    external: <><path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v5H5V6h5" /></>,
    undo: <><path d="M9 7 5 11l4 4" /><path d="M5 11h8a5 5 0 0 1 0 10h-2" /></>,
    heart: <path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 4.5-7 9-7 9z" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    shirt: <path d="m8 4 4 2 4-2 5 3-2 5-2-1v9H7v-9l-2 1-2-5z" />,
    scissors: <><circle cx="6" cy="7" r="2" /><circle cx="6" cy="17" r="2" /><path d="m8 8 11 9M8 16 19 7" /></>,
    palette: <><path d="M12 4a8 8 0 1 0 0 16h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4 4 4 0 0 0-8-4z" /><path d="M8 9h.01M12 7h.01M16 9h.01" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    star: <path d="m12 3 2.7 6 6.3.7-4.7 4.2 1.4 6.1L12 17l-5.7 3 1.4-6.1L3 9.7 9.3 9z" />,
    pin: <><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
