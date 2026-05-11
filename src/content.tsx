import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';

export const Content = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Content(
  { style, children, ...rest },
  ref,
) {
  const {
    sheetRef,
    onPress,
    onRelease,
    onDrag,
    snapPointsOffset,
    activeSnapPointIndex,
    modal,
    isOpen,
    snapPoints,
    container,
    handleOnly,
    shouldAnimate,
    titleId,
    descriptionId,
    floating,
  } = useSheetContext();

  const [delayedSnapPoints, setDelayedSnapPoints] = useState(false);
  // Start "closed" on mount, transition to "open" after one frame
  const [mounted, setMounted] = useState(false);
  const composedRef = useComposedRefs(ref, sheetRef);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastKnownPointerEventRef = useRef<React.PointerEvent<HTMLDivElement> | null>(null);
  const wasBeyondThePointRef = useRef(false);
  const hasSnapPoints = snapPoints && snapPoints.length > 0;

  // Trigger enter animation: mount in closed position, then open after a frame
  useEffect(() => {
    if (!isOpen) {
      setMounted(false);
      return;
    }
    // Double RAF to ensure the browser has painted the closed state first
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const isDeltaInDirection = (delta: { x: number; y: number }, threshold = 0) => {
    if (wasBeyondThePointRef.current) return true;

    const deltaY = Math.abs(delta.y);
    const deltaX = Math.abs(delta.x);
    const isDeltaX = deltaX > deltaY;
    const isReverseDirection = delta.y < 0;

    if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) {
      return !isDeltaX;
    }

    wasBeyondThePointRef.current = true;
    return true;
  };

  useEffect(() => {
    if (hasSnapPoints) {
      window.requestAnimationFrame(() => setDelayedSnapPoints(true));
    }
  }, []);

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement> | null) {
    pointerStartRef.current = null;
    wasBeyondThePointRef.current = false;
    onRelease(event);
  }

  // Determine visual state: only "open" after mounted transition
  const visualState = isOpen && mounted ? 'open' : 'closed';

  const computedStyle: CSSProperties =
    snapPointsOffset && snapPointsOffset.length > 0
      ? ({
          '--snap-point-height': `${snapPointsOffset[activeSnapPointIndex ?? 0]!}px`,
          ...style,
        } as CSSProperties)
      : (style ?? {});

  return (
    <div
      {...rest}
      ref={composedRef}
      role="dialog"
      aria-modal={modal}
      aria-labelledby={titleId || undefined}
      aria-describedby={descriptionId || undefined}
      data-glidesheet=""
      data-state={visualState}
      data-delayed-snap-points={delayedSnapPoints ? 'true' : 'false'}
      data-snap-points={isOpen && hasSnapPoints ? 'true' : 'false'}
      data-custom-container={container ? 'true' : 'false'}
      data-animate={shouldAnimate?.current ? 'true' : 'false'}
      data-floating={floating ? 'true' : 'false'}
      style={computedStyle}
      onPointerDown={(event) => {
        if (handleOnly) return;
        rest.onPointerDown?.(event);
        pointerStartRef.current = { x: event.pageX, y: event.pageY };
        onPress(event);
      }}
      onPointerMove={(event) => {
        lastKnownPointerEventRef.current = event;
        if (handleOnly) return;
        rest.onPointerMove?.(event);
        if (!pointerStartRef.current) return;

        const yPosition = event.pageY - pointerStartRef.current.y;
        const xPosition = event.pageX - pointerStartRef.current.x;
        const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2;
        const delta = { x: xPosition, y: yPosition };

        const isAllowedToSwipe = isDeltaInDirection(delta, swipeStartThreshold);
        if (isAllowedToSwipe) {
          onDrag(event);
        } else if (Math.abs(xPosition) > swipeStartThreshold || Math.abs(yPosition) > swipeStartThreshold) {
          pointerStartRef.current = null;
        }
      }}
      onPointerUp={(event) => {
        rest.onPointerUp?.(event);
        handlePointerUp(event);
      }}
      onPointerOut={(event) => {
        rest.onPointerOut?.(event);
        handlePointerUp(lastKnownPointerEventRef.current);
      }}
      onContextMenu={(event) => {
        rest.onContextMenu?.(event);
        if (lastKnownPointerEventRef.current) handlePointerUp(lastKnownPointerEventRef.current);
      }}
    >
      {children}
      {!floating && <div data-glidesheet-extension="" aria-hidden="true" />}
    </div>
  );
});
