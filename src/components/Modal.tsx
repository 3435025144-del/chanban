import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/35" onClick={onClose} />
      <div className="relative w-full max-w-[375px] bg-white rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto no-scrollbar animate-pop-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted text-xl leading-none px-2" aria-label="关闭">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
