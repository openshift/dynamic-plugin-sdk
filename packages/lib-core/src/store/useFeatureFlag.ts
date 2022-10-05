import * as React from 'react';
import type { PluginStoreInterface } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginStore } from './PluginStoreContext';
import { usePluginSubscription } from './usePluginSubscription';

const eventTypes = [PluginEventType.FeatureFlagsChanged];

const isSameData = (prevData: boolean, nextData: boolean) => prevData === nextData;

type UseFeatureFlagResult = [currentValue: boolean, setValue: (newValue: boolean) => void];

/**
 * React hook that provides access to a feature flag.
 *
 * This hook re-renders the component whenever the value of the given flag is updated.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @example
 * ```ts
 * const [flag, setFlag] = useFeatureFlag('FOO');
 * ...
 * setFlag(true);
 * ```
 */
export const useFeatureFlag = (name: string): UseFeatureFlagResult => {
  const getData = React.useCallback(
    (pluginStore: PluginStoreInterface) => pluginStore.getFeatureFlags()[name],
    [name],
  );
  const currentValue = usePluginSubscription(eventTypes, getData, isSameData);
  const pluginStore = usePluginStore();

  const setValue = React.useCallback(
    (value: boolean) => {
      pluginStore.setFeatureFlags({ [name]: value });
    },
    [pluginStore, name],
  );

  return [currentValue, setValue];
};
