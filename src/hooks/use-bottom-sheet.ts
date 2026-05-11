import { useMemo } from 'react';
import { useSheetContext } from '../context';
import type { SnapPoint } from '../types';

export interface UseBottomSheetReturn {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Whether the user is actively dragging the sheet */
  isDragging: boolean;
  /** Whether the sheet is at the highest snap point (fully expanded) */
  isFullyOpen: boolean;
  /** Whether the sheet is at the lowest snap point (minimized, not closed) */
  isMinimized: boolean;
  /** Whether the sheet is closed (not visible) */
  isClosed: boolean;
  /** The current active snap point value */
  activeSnapPoint: SnapPoint | null | undefined;
  /** The index of the current snap point in the snapPoints array */
  activeSnapPointIndex: number | null;
  /** All defined snap points */
  snapPoints: SnapPoint[] | undefined;
  /** Whether the sheet is in modal mode */
  modal: boolean;
  /** Whether the sheet is in floating mode */
  floating: boolean;
  /** Close the sheet programmatically */
  close: () => void;
  /** Open the sheet programmatically */
  open: () => void;
  /** Navigate to a specific snap point */
  snapTo: (snapPoint: SnapPoint) => void;
}

export function useBottomSheet(): UseBottomSheetReturn {
  const ctx = useSheetContext();

  return useMemo(() => {
    const isFullyOpen = ctx.snapPoints
      ? ctx.activeSnapPoint === ctx.snapPoints[ctx.snapPoints.length - 1]
      : ctx.isOpen;

    const isMinimized = ctx.snapPoints
      ? ctx.activeSnapPointIndex === 0 ||
        ctx.activeSnapPoint === ctx.snapPoints?.[0]
      : false;

    return {
      isOpen: ctx.isOpen,
      isDragging: ctx.isDragging,
      isFullyOpen,
      isMinimized,
      isClosed: !ctx.isOpen,
      activeSnapPoint: ctx.activeSnapPoint,
      activeSnapPointIndex: ctx.activeSnapPointIndex,
      snapPoints: ctx.snapPoints,
      modal: ctx.modal,
      floating: ctx.floating,
      close: ctx.closeSheet,
      open: ctx.openSheet,
      snapTo: ctx.setActiveSnapPoint,
    };
  }, [
    ctx.isOpen,
    ctx.isDragging,
    ctx.activeSnapPoint,
    ctx.activeSnapPointIndex,
    ctx.snapPoints,
    ctx.modal,
    ctx.floating,
    ctx.closeSheet,
    ctx.openSheet,
    ctx.setActiveSnapPoint,
  ]);
}
