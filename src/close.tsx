import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useSheetContext } from './context';

export const Close = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Close({ onClick, ...rest }, ref) {
    const { closeSheet } = useSheetContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          closeSheet();
          onClick?.(e);
        }}
        {...rest}
      />
    );
  },
);
