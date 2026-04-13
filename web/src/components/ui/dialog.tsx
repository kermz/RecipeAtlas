import { PropsWithChildren, useEffect, useState } from 'react';
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
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, 240);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

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

  if (!shouldRender) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,8,12,0.78)] px-4 py-6 backdrop-blur-md sm:py-8',
        open ? 'overlay-fade-in' : 'overlay-fade-out'
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'max-h-[min(92vh,860px)] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(8,11,18,0.98))] p-5 shadow-[0_28px_120px_rgba(0,0,0,0.48)] sm:p-7',
          open ? 'modal-rise-in' : 'modal-fall-out',
          className
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <h2 className="app-heading text-2xl font-semibold text-white">{title}</h2>
            {description ? <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p> : null}
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
