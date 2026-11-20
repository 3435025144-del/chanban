import { useEffect, type ReactNode } from 'react';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissOnMask?: boolean;
  showClose?: boolean;
  z?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  dismissOnMask = false,
  showClose = true,
  z = 'z-[60]',
}: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center p-4`} role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-text/35"
        onClick={dismissOnMask ? onClose : undefined}
      />
      <div className="relative w-[82%] max-w-[320px] max-h-[82vh] overflow-y-auto no-scrollbar rounded-[24px] bg-card p-5 shadow-modal animate-pop-in">
        {(title || showClose) && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-text">{title ?? ''}</h3>
            {showClose && (
              <button onClick={onClose} className="icon-btn -mr-2" aria-label="关闭">
                <Icon name="close" size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
