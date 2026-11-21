import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissOnMask?: boolean;
  showClose?: boolean;
  z?: string;
  overlayClass?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  dismissOnMask = false,
  showClose = true,
  z = 'z-[90]',
  overlayClass = 'bg-black/50',
}: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className={`fixed inset-0 ${z} flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`absolute inset-0 ${overlayClass}`}
        onClick={dismissOnMask ? onClose : undefined}
      />
      <div
        className="relative w-[82%] max-w-[320px] max-h-[82vh] overflow-y-auto no-scrollbar rounded-[24px] bg-card p-5 shadow-modal animate-pop-in"
        onClick={(event) => event.stopPropagation()}
      >
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
    </div>,
    document.body,
  );
}
