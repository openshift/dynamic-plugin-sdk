import type { Dispatch } from 'react';
import { useState, useCallback } from 'react';
import { useEventListener } from './useEventListener';

const tryJSONParse = <T>(data: string): string | T => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

/**
 * Local storage value and setter for `key`.
 * NOTE: This hook will not update it's value if the same key has been set elsewhere in the current tab.
 *
 * @returns setter and JSON value if parseable, or else `string`.
 */
export const useLocalStorage = <T extends object>(key: string): [T | string, Dispatch<T>] => {
  const [value, setValue] = useState(tryJSONParse<T>(window.localStorage.getItem(key) ?? ''));

  useEventListener(window, 'storage', () => {
    setValue(tryJSONParse(window.localStorage.getItem(key) ?? ''));
  });

  const updateValue = useCallback(
    (val: T | string) => {
      const serializedValue = typeof val === 'object' ? JSON.stringify(val) : val;
      window.localStorage.setItem(key, serializedValue);
      setValue(val);
    },
    [key],
  );

  return [value, updateValue];
};
