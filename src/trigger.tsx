import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useSheetContext } from './context';

export const Trigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Trigger({ onClick, ...rest }, ref) {
    const { openSheet, isOpen } = useSheetContext();

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={(e) => {
          openSheet();
          onClick?.(e);
        }}
        {...rest}
      />
    );
  },
);
