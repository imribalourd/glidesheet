import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { SheetContext } from './context';
import { useControllableState } from './hooks/use-controllable-state';
import { useSnapPoints } from './hooks/use-snap-points';
import { useBodyLock } from './hooks/use-body-lock';
import { useFocusTrap } from './hooks/use-focus-trap';
import { set, reset } from './utils/style-cache';
import { getTranslateY, isInput } from './utils/dom';
import { dampenValue } from './utils/math';
import {
  TRANSITIONS,
  VELOCITY_THRESHOLD,
  CLOSE_THRESHOLD,
  SCROLL_LOCK_TIMEOUT,
  NESTED_DISPLACEMENT,
  DRAG_CLASS,
} from './constants';
import { isIOS } from './utils/browser';
import type { BottomSheetRootProps } from './types';

export function Root({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  onDrag: onDragProp,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  onRelease: onReleaseProp,
  snapPoints,
  closeThreshold = CLOSE_THRESHOLD,
  scrollLockTimeout = SCROLL_LOCK_TIMEOUT,
  dismissible = true,
  handleOnly = false,
  fadeFromIndex = snapPoints && snapPoints.length - 1,
  activeSnapPoint: activeSnapPointProp,
  onActiveSnapPointChange: setActiveSnapPointProp,
  modal = true,
  onClose,
  nested = false,
  noBodyStyles = false,
  snapToSequentialPoint = false,
  repositionInputs = true,
  floating = false,
  onAnimationEnd,
  container = null,
}: BottomSheetRootProps) {
  const [isOpen = false, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    prop: openProp,
    onChange: (o: boolean) => {
      onOpenChange?.(o);

      if (o && !modal) {
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            document.body.style.pointerEvents = 'auto';
          });
        }
      }

      if (!o) {
        document.body.style.pointerEvents = 'auto';
      }
    },
  });

  const [isDragging, setIsDragging] = useState(false);
  const [titleId, setTitleId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openTime = useRef<Date | null>(null);
  const dragStartTime = useRef<Date | null>(null);
  const lastTimeDragPrevented = useRef<Date | null>(null);
  const isAllowedToDrag = useRef(false);
  const nestedOpenChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef(0);
  const keyboardIsOpen = useRef(false);
  const shouldAnimate = useRef(!defaultOpen);
  const hasBeenOpened = useRef(false);
  const justReleased = useRef(false);
  const previousDiffFromInitial = useRef(0);
  const drawerHeightRef = useRef(0);
  const initialDrawerHeight = useRef(0);

  const onSnapPointChange = useCallback(
    (activeSnapPointIndex: number) => {
      if (snapPoints && activeSnapPointIndex === snapPointsOffset.length - 1) {
        openTime.current = new Date();
      }
    },
    [],
  );

  const {
    activeSnapPoint,
    activeSnapPointIndex,
    setActiveSnapPoint,
    onRelease: onReleaseSnapPoints,
    snapPointsOffset,
    onDrag: onDragSnapPoints,
    shouldFade,
    getPercentageDragged: getSnapPointsPercentageDragged,
    isLastSnapPoint,
  } = useSnapPoints({
    snapPoints,
    activeSnapPointProp,
    setActiveSnapPointProp,
    sheetRef,
    fadeFromIndex,
    overlayRef,
    onSnapPointChange,
    container,
    snapToSequentialPoint,
  });

  useBodyLock({ isOpen, modal, noBodyStyles });
  useFocusTrap({ isOpen, modal, sheetRef });

  // ESC key to close (was handled by Radix Dialog before)
  useEffect(() => {
    if (!isOpen || !dismissible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismissible]);

  // onAnimationEnd via transitionend (fixes Vaul #520)
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !onAnimationEnd) return;

    const handler = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'transform') return;
      onAnimationEnd(isOpen);
    };

    el.addEventListener('transitionend', handler);
    return () => el.removeEventListener('transitionend', handler);
  }, [isOpen, onAnimationEnd]);

  function shouldDrag(el: EventTarget, isDraggingInDirection: boolean) {
    let element = el as HTMLElement;
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = sheetRef.current ? getTranslateY(sheetRef.current) : null;
    const date = new Date();

    if (element.tagName === 'SELECT') return false;
    if (element.hasAttribute('data-glidesheet-no-drag') || element.closest('[data-glidesheet-no-drag]')) return false;
    if (openTime.current && date.getTime() - openTime.current.getTime() < 500) return false;
    if (swipeAmount !== null && swipeAmount > 0) return true;
    if (highlightedText && highlightedText.length > 0) return false;

    if (
      lastTimeDragPrevented.current &&
      date.getTime() - lastTimeDragPrevented.current.getTime() < scrollLockTimeout &&
      swipeAmount === 0
    ) {
      lastTimeDragPrevented.current = date;
      return false;
    }

    if (isDraggingInDirection) {
      lastTimeDragPrevented.current = date;
      return false;
    }

    while (element) {
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop !== 0) {
          lastTimeDragPrevented.current = new Date();
          return false;
        }
        if (element.getAttribute('role') === 'dialog') return true;
      }
      element = element.parentNode as HTMLElement;
    }

    return true;
  }

  function onPress(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dismissible && !snapPoints) return;
    if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) return;

    drawerHeightRef.current = sheetRef.current?.getBoundingClientRect().height || 0;
    setIsDragging(true);
    onDragStartProp?.();
    dragStartTime.current = new Date();

    if (isIOS()) {
      window.addEventListener('touchend', () => (isAllowedToDrag.current = false), { once: true });
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    pointerStart.current = event.pageY;
  }

  function onDragHandler(event: ReactPointerEvent<HTMLDivElement>) {
    if (!sheetRef.current || !isDragging) {
      console.log('[glidesheet] onDrag blocked', { hasRef: !!sheetRef.current, isDragging });
      return;
    }

    const draggedDistance = (pointerStart.current - event.pageY) * 1; // bottom: multiplier = 1
    const isDraggingInDirection = draggedDistance > 0;
    const noCloseSnapPointsPreCondition = snapPoints && !dismissible && !isDraggingInDirection;

    if (noCloseSnapPointsPreCondition && activeSnapPointIndex === 0) return;

    const absDraggedDistance = Math.abs(draggedDistance);
    let percentageDragged = absDraggedDistance / drawerHeightRef.current;
    const snapPointPercentageDragged = getSnapPointsPercentageDragged(absDraggedDistance, isDraggingInDirection);

    if (snapPointPercentageDragged !== null) percentageDragged = snapPointPercentageDragged;
    if (noCloseSnapPointsPreCondition && percentageDragged >= 1) return;
    if (!isAllowedToDrag.current && !shouldDrag(event.target, isDraggingInDirection)) {
      console.log('[glidesheet] shouldDrag blocked');
      return;
    }

    sheetRef.current.classList.add(DRAG_CLASS);
    isAllowedToDrag.current = true;
    set(sheetRef.current, { transition: 'none' });
    set(overlayRef.current, { transition: 'none' });

    if (snapPoints) {
      console.log('[glidesheet] onDragSnapPoints', { draggedDistance, activeSnapPointOffset: snapPointsOffset[activeSnapPointIndex ?? 0] });
      onDragSnapPoints({ draggedDistance });
    }

    // Don't allow dragging upward past the open position (no stretch effect)
    if (isDraggingInDirection && !snapPoints) {
      return;
    }

    const opacityValue = 1 - percentageDragged;
    if (shouldFade || (fadeFromIndex && activeSnapPointIndex === fadeFromIndex - 1)) {
      onDragProp?.(event, percentageDragged);
      set(overlayRef.current, { opacity: `${opacityValue}`, transition: 'none' }, true);
    }

    if (!snapPoints) {
      set(sheetRef.current, { transform: `translate3d(0, ${absDraggedDistance}px, 0)` });
    }
  }

  function resetDrawer() {
    if (!sheetRef.current) return;
    set(sheetRef.current, {
      transform: 'translate3d(0, 0, 0)',
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
    });
    set(overlayRef.current, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });
  }

  function cancelDrag() {
    if (!isDragging || !sheetRef.current) return;
    sheetRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    onDragEndProp?.();
  }

  function closeSheet() {
    cancelDrag();
    onClose?.();
    setIsOpen(false);

    setTimeout(() => {
      if (snapPoints) setActiveSnapPoint(snapPoints[0]);
    }, TRANSITIONS.DURATION * 1000);
  }

  function openSheet() {
    if (!isOpen) {
      hasBeenOpened.current = true;
      setIsOpen(true);
    }
  }

  function onReleaseHandler(event: ReactPointerEvent<HTMLDivElement> | null) {
    if (!isDragging || !sheetRef.current) return;

    sheetRef.current.classList.remove(DRAG_CLASS);
    isAllowedToDrag.current = false;
    setIsDragging(false);
    onDragEndProp?.();

    const swipeAmount = getTranslateY(sheetRef.current);
    if (!event || !shouldDrag(event.target, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;
    if (dragStartTime.current === null) return;

    const timeTaken = Date.now() - dragStartTime.current.getTime();
    const distMoved = pointerStart.current - event.pageY;
    const velocity = Math.abs(distMoved) / timeTaken;

    if (velocity > 0.05) {
      justReleased.current = true;
      setTimeout(() => { justReleased.current = false; }, 200);
    }

    if (snapPoints) {
      onReleaseSnapPoints({ draggedDistance: distMoved, closeDrawer: closeSheet, velocity, dismissible });
      onReleaseProp?.(event, true);
      return;
    }

    if (distMoved > 0) {
      resetDrawer();
      onReleaseProp?.(event, true);
      return;
    }

    if (velocity > VELOCITY_THRESHOLD) {
      closeSheet();
      onReleaseProp?.(event, false);
      return;
    }

    const visibleHeight = Math.min(sheetRef.current.getBoundingClientRect().height ?? 0, window.innerHeight);
    if (Math.abs(swipeAmount) >= visibleHeight * closeThreshold) {
      closeSheet();
      onReleaseProp?.(event, false);
      return;
    }

    onReleaseProp?.(event, true);
    resetDrawer();
  }

  useEffect(() => {
    window.requestAnimationFrame(() => {
      shouldAnimate.current = true;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset(document.documentElement, 'scrollBehavior');
      return;
    }
    set(document.documentElement, { scrollBehavior: 'auto' });
    openTime.current = new Date();
    hasBeenOpened.current = true;

    if (!modal) {
      window.requestAnimationFrame(() => {
        document.body.style.pointerEvents = 'auto';
      });
    }
  }, [isOpen, modal]);

  // VisualViewport keyboard handling
  useEffect(() => {
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
  }, [activeSnapPointIndex, snapPoints, snapPointsOffset]);

  // Nested support
  function onNestedOpenChange(o: boolean) {
    const scale = o ? (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth : 1;
    const translate = o ? -NESTED_DISPLACEMENT : 0;

    if (nestedOpenChangeTimer.current) window.clearTimeout(nestedOpenChangeTimer.current);

    set(sheetRef.current, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      transform: `scale(${scale}) translate3d(0, ${translate}px, 0)`,
    });

    if (!o && sheetRef.current) {
      nestedOpenChangeTimer.current = setTimeout(() => {
        const translateValue = getTranslateY(sheetRef.current as HTMLElement);
        set(sheetRef.current, {
          transition: 'none',
          transform: `translate3d(0, ${translateValue}px, 0)`,
        });
      }, 500);
    }
  }

  function onNestedDrag(_event: ReactPointerEvent, percentageDragged: number) {
    if (percentageDragged < 0) return;
    const initialScale = (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth;
    const newScale = initialScale + percentageDragged * (1 - initialScale);
    const newTranslate = -NESTED_DISPLACEMENT + percentageDragged * NESTED_DISPLACEMENT;

    set(sheetRef.current, {
      transform: `scale(${newScale}) translate3d(0, ${newTranslate}px, 0)`,
      transition: 'none',
    });
  }

  function onNestedRelease(_event: ReactPointerEvent, o: boolean) {
    const scale = o ? (window.innerHeight - NESTED_DISPLACEMENT) / window.innerHeight : 1;
    const translate = o ? -NESTED_DISPLACEMENT : 0;

    if (o) {
      set(sheetRef.current, {
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        transform: `scale(${scale}) translate3d(0, ${translate}px, 0)`,
      });
    }
  }

  return (
    <SheetContext.Provider
      value={{
        sheetRef,
        overlayRef,
        isOpen,
        isDragging,
        modal,
        dismissible,
        handleOnly,
        nested,
        snapPoints,
        activeSnapPoint,
        activeSnapPointIndex,
        snapPointsOffset,
        shouldFade,
        shouldAnimate,
        keyboardIsOpen,
        container,
        hasBeenOpened: hasBeenOpened.current,
        isLastSnapPoint,
        closeThreshold,
        scrollLockTimeout,
        fadeFromIndex,
        onPress,
        onDrag: onDragHandler,
        onRelease: onReleaseHandler,
        closeSheet,
        openSheet,
        setActiveSnapPoint,
        onNestedDrag,
        onNestedOpenChange,
        onNestedRelease,
        titleId,
        descriptionId,
        setTitleId,
        setDescriptionId,
        repositionInputs,
        floating,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}
