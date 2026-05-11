import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useSheetContext } from './context';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
  /** Keep mounted even when closed. Default: false */
  forceMount?: boolean;
}

export function Portal({ children, container, forceMount = false }: PortalProps) {
  const ctx = useSheetContext();

  if (!ctx.isOpen && !forceMount) return null;

  const target = container ?? ctx.container ?? (typeof document !== 'undefined' ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
}
