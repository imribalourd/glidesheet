import { forwardRef, useEffect, useId, type HTMLAttributes } from 'react';
import { useSheetContext } from './context';

export const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function Title(props, ref) {
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const { setTitleId } = useSheetContext();

    useEffect(() => {
      setTitleId(id);
      return () => setTitleId('');
    }, [id, setTitleId]);

    return <h2 ref={ref} id={id} {...props} />;
  },
);
