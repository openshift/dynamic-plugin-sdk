import * as React from 'react';
import type { PluginEventType, PluginConsumer } from '../types/store';
import { usePluginConsumer } from './PluginStoreContext';

const isSameReference = (a: unknown, b: unknown) => a === b;

/**
 * React hook for subscribing to `PluginStore` events via the {@link PluginConsumer} interface.
 *
 * This hook implements the common {@link PluginConsumer} usage pattern:
 *
 * ```
 * pluginConsumer.subscribe(eventTypes, () => {
 *   // get current data from pluginConsumer
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
  getData: (pluginConsumer: PluginConsumer) => TPluginData,
  isSameData: (prevData: TPluginData, nextData: TPluginData) => boolean = isSameReference,
): TPluginData => {
  const pluginConsumer = usePluginConsumer();

  const getDataRef = React.useRef<typeof getData>(getData);
  getDataRef.current = getData;

  const isSameDataRef = React.useRef<typeof isSameData>(isSameData);
  isSameDataRef.current = isSameData;

  const [hookResult, setHookResult] = React.useState<TPluginData>(() => getData(pluginConsumer));

  const updateResult = React.useCallback(() => {
    const nextData = getDataRef.current(pluginConsumer);

    setHookResult((prevData) => (isSameDataRef.current(prevData, nextData) ? prevData : nextData));
  }, [pluginConsumer]);

  React.useEffect(() => updateResult(), [getData, isSameData, updateResult]);

  React.useEffect(
    () => pluginConsumer.subscribe(eventTypes, updateResult),
    [pluginConsumer, eventTypes, updateResult],
  );

  return hookResult;
};
