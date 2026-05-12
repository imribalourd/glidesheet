import { useRef, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { set } from '../utils/style-cache';
import { getTranslateY } from '../utils/dom';
import { TRANSITIONS, NESTED_DISPLACEMENT } from '../constants';

export function useNested({
  sheetRef,
}: {
  sheetRef: RefObject<HTMLDivElement | null>;
}) {
  const nestedOpenChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return { onNestedOpenChange, onNestedDrag, onNestedRelease };
}
