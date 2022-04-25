import * as React from 'react';

export const usePrevious = <P = unknown>(value: P, deps?: unknown[]): P | undefined => {
  const ref = React.useRef<P>();

  React.useEffect(() => {
    ref.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || [value]);

  return ref.current;
};
