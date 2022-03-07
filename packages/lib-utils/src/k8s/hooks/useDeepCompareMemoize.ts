import * as _ from 'lodash-es';
import * as React from 'react';

export const useDeepCompareMemoize = <T = unknown>(value: T, stringify?: boolean): T => {
  const ref = React.useRef<T>(value);

  if (
    stringify
      ? JSON.stringify(value) !== JSON.stringify(ref.current)
      : !_.isEqual(value, ref.current)
  ) {
    ref.current = value;
  }

  return ref.current;
};
