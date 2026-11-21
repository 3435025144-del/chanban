import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, eyebrow, title, headerExtra, footer, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-text/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-sheet-up relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[24px] bg-card pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(32,34,32,0.06)]"
        style={{ maxHeight: '85vh' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" style={{ flexShrink: 0 }} />
        <div className="shrink-0 px-5 pb-3 pt-3" style={{ flexShrink: 0 }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow && <p className="muted">{eyebrow}</p>}
              <h3 className="mt-1 text-[19px] font-bold text-text">{title}</h3>
            </div>
            <button onClick={onClose} className="icon-btn h-9 w-9 shrink-0" aria-label="关闭面板"><Icon name="close" size={18} /></button>
          </div>
          {headerExtra && <div className="mt-2">{headerExtra}</div>}
        </div>
        <div
          className="no-scrollbar overscroll-contain min-h-0 flex-1 overflow-y-auto px-5"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-border bg-card px-5 pt-3" style={{ flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
