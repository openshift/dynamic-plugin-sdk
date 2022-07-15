import * as React from 'react';
import type { PluginEventType, PluginStoreInterface } from '../types/store';
import { usePluginStore } from './PluginStoreContext';

const isSameReference = (a: unknown, b: unknown) => a === b;

/**
 * React hook for subscribing to `PluginStore` events.
 *
 * This hook implements the common `PluginStore` usage pattern:
 *
 * ```
 * pluginStore.subscribe(eventTypes, () => {
 *   // get current data from plugin store
 *   // compare current data with previous data
 *   // re-render the component on data change
 * });
 * ```
 *
 * Returns the current data as retrieved by `getData` function.
 *
 * Return value changes only if both of the following conditions are true:
 * - `PluginStore` has emitted events of interest
 * - current data has changed, compared to previously referenced data
 *
 * The referential stability of the hook's result depends on a stable implementation
 * of `isSameData` function. If not specified, the hook performs a reference equality
 * comparison.
 */
export const usePluginSubscription = <TPluginData>(
  eventTypes: PluginEventType[],
  getData: (pluginStore: PluginStoreInterface) => TPluginData,
  isSameData: (prevData: TPluginData, nextData: TPluginData) => boolean = isSameReference,
): TPluginData => {
  const pluginStore = usePluginStore();

  const getDataRef = React.useRef<typeof getData>(getData);
  getDataRef.current = getData;

  const isSameDataRef = React.useRef<typeof isSameData>(isSameData);
  isSameDataRef.current = isSameData;

  const [hookResult, setHookResult] = React.useState<TPluginData>(() => getData(pluginStore));

  const updateResult = React.useCallback(() => {
    const nextData = getDataRef.current(pluginStore);

    setHookResult((prevData) => (isSameDataRef.current(prevData, nextData) ? prevData : nextData));
  }, [pluginStore]);

  React.useEffect(() => updateResult(), [getData, isSameData, updateResult]);

  React.useEffect(
    () => pluginStore.subscribe(eventTypes, updateResult),
    [pluginStore, eventTypes, updateResult],
  );

  return hookResult;
};
