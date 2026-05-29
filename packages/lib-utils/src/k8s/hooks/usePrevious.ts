import { useEffect, useRef } from 'react';

export const usePrevious = <P = unknown>(value: P, deps?: unknown[]): P | undefined => {
  const ref = useRef<P>();

  // prettier-ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ref.current = value; }, deps || [value]);

  return ref.current;
};
