import React, { useEffect, useRef, type RefObject } from 'react';
import { isInput } from '../utils/dom';
import type { SnapPoint } from '../types';

export function useKeyboard({
  sheetRef,
  isOpen,
  repositionInputs,
  snapPoints,
  snapPointsOffset,
  activeSnapPointIndex,
  keyboardIsOpen,
}: {
  sheetRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  repositionInputs: boolean;
  snapPoints: SnapPoint[] | undefined;
  snapPointsOffset: number[];
  activeSnapPointIndex: number | null;
  keyboardIsOpen: React.MutableRefObject<boolean>;
}) {
  const previousDiffFromInitial = useRef(0);
  const initialDrawerHeight = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    function onVisualViewportChange() {
      if (!sheetRef.current || !repositionInputs) return;
      const focusedElement = document.activeElement as HTMLElement;
      if (!isInput(focusedElement) && !keyboardIsOpen.current) return;

      const visualViewportHeight = window.visualViewport?.height || 0;
      const totalHeight = window.innerHeight;
      let diffFromInitial = totalHeight - visualViewportHeight;
      const drawerHeight = sheetRef.current.getBoundingClientRect().height || 0;

      if (!initialDrawerHeight.current) initialDrawerHeight.current = drawerHeight;

      if (Math.abs(previousDiffFromInitial.current - diffFromInitial) > 60) {
        keyboardIsOpen.current = !keyboardIsOpen.current;
      }

      if (snapPoints && snapPoints.length > 0 && snapPointsOffset && activeSnapPointIndex) {
        diffFromInitial += snapPointsOffset[activeSnapPointIndex] || 0;
      }
      previousDiffFromInitial.current = diffFromInitial;

      if (drawerHeight > visualViewportHeight || keyboardIsOpen.current) {
        const isTallEnough = drawerHeight > totalHeight * 0.8;
        const offsetFromTop = sheetRef.current.getBoundingClientRect().top;
        const newHeight = Math.max(
          visualViewportHeight - (isTallEnough ? offsetFromTop : 26),
          visualViewportHeight - offsetFromTop,
        );
        sheetRef.current.style.height = `${newHeight}px`;
      } else {
        sheetRef.current.style.height = `${initialDrawerHeight.current}px`;
      }

      if (snapPoints && snapPoints.length > 0 && !keyboardIsOpen.current) {
        sheetRef.current.style.bottom = '0px';
      } else {
        sheetRef.current.style.bottom = `${Math.max(diffFromInitial, 0)}px`;
      }
    }

    window.visualViewport?.addEventListener('resize', onVisualViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', onVisualViewportChange);
  }, [isOpen, activeSnapPointIndex, snapPoints, snapPointsOffset]);
}
