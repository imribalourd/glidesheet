import { forwardRef, useCallback, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';
import { useComposedRefs } from './hooks/use-composed-refs';

export const Overlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Overlay(props, ref) {
    const { overlayRef, snapPoints, shouldFade, isOpen, modal, shouldAnimate, onRelease } =
      useSheetContext();
    const composedRef = useComposedRefs(ref, overlayRef);
    const hasSnapPoints = snapPoints && snapPoints.length > 0;

    const handleMouseUp = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => onRelease(event),
      [onRelease],
    );

    if (!modal) return null;

    return (
      <div
        ref={composedRef}
        data-glidesheet-overlay=""
        data-state={isOpen ? 'open' : 'closed'}
        data-snap-points={isOpen && hasSnapPoints ? 'true' : 'false'}
        data-snap-points-overlay={isOpen && shouldFade ? 'true' : 'false'}
        data-animate={shouldAnimate?.current ? 'true' : 'false'}
        onPointerUp={handleMouseUp}
        {...props}
      />
    );
  },
);
