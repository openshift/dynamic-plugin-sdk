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

  const eventTypesRef = React.useRef<typeof eventTypes>(eventTypes);
  const getDataRef = React.useRef<typeof getData>(getData);
  const isSameDataRef = React.useRef<typeof isSameData>(isSameData);

  const [hookResult, setHookResult] = React.useState<TPluginData>(() => getData(pluginConsumer));
  const unsubscribeRef = React.useRef<VoidFunction>();

  const trySubscribe = React.useCallback(() => {
    if (unsubscribeRef.current === undefined) {
      unsubscribeRef.current = pluginConsumer.subscribe(eventTypesRef.current, () => {
        const nextData = getDataRef.current(pluginConsumer);

        setHookResult((prevData) =>
          isSameDataRef.current(prevData, nextData) ? prevData : nextData,
        );
      });
    }
  }, [pluginConsumer, setHookResult]);

  const tryUnsubscribe = React.useCallback(() => {
    if (unsubscribeRef.current !== undefined) {
      unsubscribeRef.current();
      unsubscribeRef.current = undefined;
    }
  }, []);

  React.useEffect(() => {
    eventTypesRef.current = eventTypes;
    getDataRef.current = getData;
    isSameDataRef.current = isSameData;

    trySubscribe();

    return () => {
      tryUnsubscribe();
    };
  }, [trySubscribe, tryUnsubscribe, eventTypes, getData, isSameData]);

  return hookResult;
};
