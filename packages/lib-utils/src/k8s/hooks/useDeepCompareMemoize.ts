import { isEqual } from 'lodash';
import { useRef } from 'react';

export const useDeepCompareMemoize = <T = unknown>(value: T, stringify?: boolean): T => {
  const ref = useRef<T>(value);

  if (
    stringify ? JSON.stringify(value) !== JSON.stringify(ref.current) : !isEqual(value, ref.current)
  ) {
    ref.current = value;
  }

  return ref.current;
};
