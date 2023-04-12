import { isEqual } from 'lodash';
import * as React from 'react';

export const useDeepCompareMemoize = <T = unknown>(value: T, stringify?: boolean): T => {
  const ref = React.useRef<T>(value);

  if (
    stringify ? JSON.stringify(value) !== JSON.stringify(ref.current) : !isEqual(value, ref.current)
  ) {
    ref.current = value;
  }

  return ref.current;
};
