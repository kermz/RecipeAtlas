import { PropsWithChildren, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';
import { Button } from './button';

type DialogProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  className?: string;
}>;

export function Dialog({ open, title, description, onClose, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={cn('w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#08101f] p-6 shadow-2xl', className)}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="app-heading text-2xl font-semibold text-white">{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
