import { useSheetContext } from './context';
import { Root } from './bottom-sheet';
import type { BottomSheetRootProps } from './types';

export function NestedRoot({ onDrag, onOpenChange, open, ...rest }: BottomSheetRootProps) {
  const { onNestedDrag, onNestedOpenChange, onNestedRelease } = useSheetContext();

  return (
    <Root
      nested
      open={open}
      onClose={() => {
        onNestedOpenChange(false);
      }}
      onDrag={(e, p) => {
        onNestedDrag(e, p);
        onDrag?.(e, p);
      }}
      onOpenChange={(o) => {
        if (o) onNestedOpenChange(o);
        onOpenChange?.(o);
      }}
      onRelease={onNestedRelease}
      {...rest}
    />
  );
}
