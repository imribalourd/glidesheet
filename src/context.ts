import { createContext, useContext } from 'react';
import type { SheetContextValue } from './types';

export const SheetContext = createContext<SheetContextValue | null>(null);

export function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('BottomSheet components must be used within <BottomSheet.Root>');
  }
  return context;
}
