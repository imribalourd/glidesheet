import { forwardRef, useEffect, useId, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';

export const Description = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function Description(props, ref) {
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const { setDescriptionId } = useSheetContext();

    useEffect(() => {
      setDescriptionId(id);
      return () => setDescriptionId('');
    }, [id, setDescriptionId]);

    return <p ref={ref} id={id} {...props} />;
  },
);
