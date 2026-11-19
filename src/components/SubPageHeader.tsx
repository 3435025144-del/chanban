import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

interface Props {
  title: string;
  subtitle?: string;
  backTo?: string;
  right?: ReactNode;
}

export default function SubPageHeader({ title, subtitle, backTo = '/avatar', right }: Props) {
  return (
    <header className="mb-4 flex items-center gap-3 pt-6">
      <Link to={backTo} className="icon-btn shrink-0 bg-white shadow-card" aria-label="返回">
        <Icon name="back" size={20} />
      </Link>
      <div className="min-w-0 flex-1">
        {subtitle && <p className="muted truncate">{subtitle}</p>}
        <h1 className="mt-0.5 truncate text-xl font-bold text-ink">{title}</h1>
      </div>
      {right}
    </header>
  );
}
