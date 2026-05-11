import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useSheetContext } from './context';
import { TRANSITIONS } from './constants';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
  forceMount?: boolean;
}

export function Portal({ children, container, forceMount = false }: PortalProps) {
  const ctx = useSheetContext();
  const [shouldRender, setShouldRender] = useState(ctx.isOpen);

  useEffect(() => {
    if (ctx.isOpen) {
      setShouldRender(true);
    } else {
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, TRANSITIONS.DURATION * 1000);
      return () => clearTimeout(timer);
    }
  }, [ctx.isOpen]);

  if (!shouldRender && !forceMount) return null;

  const target = container ?? ctx.container ?? (typeof document !== 'undefined' ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
}
