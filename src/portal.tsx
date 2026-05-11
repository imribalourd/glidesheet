import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useSheetContext } from './context';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

export function Portal({ children, container }: PortalProps) {
  const ctx = useSheetContext();
  const target = container ?? ctx.container ?? (typeof document !== 'undefined' ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
}
