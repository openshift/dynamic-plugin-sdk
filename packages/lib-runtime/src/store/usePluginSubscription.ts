import * as React from 'react';
import type { PluginEventType, PluginConsumer } from '../types/store';
import { useForceRender } from '../utils/react/useForceRender';
import { usePluginConsumer } from './PluginStoreContext';

/**
 * React hook for subscribing to `PluginStore` events via the {@link PluginConsumer} interface.
 *
 * This hook implements the common {@link PluginConsumer} usage pattern:
 *
 * ```
 * pluginConsumer.subscribe(() => {
 *   // get current data from pluginConsumer
 *   // compare current data with previous data
 *   // re-render the component on data change
 * }, eventTypes);
 * ```
 *
 * Returns the current data as retrieved by `getData` function.
 *
 * Return value changes only if both of the following conditions are true:
 * - `PluginStore` has emitted events of interest
 * - current data has changed, compared to previously referenced data
 *
 * Therefore, the referential stability of the hook's result depends on a stable implementation
 * of the `isSameData` function.
 */
export const usePluginSubscription = <TPluginData>(
  getData: (pluginConsumer: PluginConsumer) => TPluginData,
  isSameData: (prevData: TPluginData, nextData: TPluginData) => boolean,
  eventTypes: PluginEventType[],
): TPluginData => {
  const pluginConsumer = usePluginConsumer();
  const forceRender = useForceRender();

  const getDataRef = React.useRef<typeof getData>(getData);
  const isSameDataRef = React.useRef<typeof isSameData>(isSameData);
  const eventTypesRef = React.useRef<typeof eventTypes>(eventTypes);

  const hookResultRef = React.useRef<TPluginData>(getData(pluginConsumer));
  const unsubscribeRef = React.useRef<VoidFunction>();
  const isMountedRef = React.useRef(true);

  const trySubscribe = React.useCallback(() => {
    if (unsubscribeRef.current === undefined) {
      unsubscribeRef.current = pluginConsumer.subscribe(() => {
        const prevData = hookResultRef.current;
        const nextData = getDataRef.current(pluginConsumer);
        const dataChanged = !isSameDataRef.current(prevData, nextData);

        if (dataChanged) {
          hookResultRef.current = nextData;
        }

        if (isMountedRef.current && dataChanged) {
          forceRender();
        }
      }, eventTypesRef.current);
    }
  }, [pluginConsumer, forceRender]);

  const tryUnsubscribe = React.useCallback(() => {
    if (unsubscribeRef.current !== undefined) {
      unsubscribeRef.current();
      unsubscribeRef.current = undefined;
    }
  }, []);

  // https://reactjs.org/docs/hooks-reference.html#useeffect
  // If you want to run an effect and clean it up only once (on mount and unmount),
  // you can pass an empty array ([]) as a second argument. This tells React that your
  // effect doesn’t depend on any values from props or state, so it never needs to re-run.
  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    getDataRef.current = getData;
    isSameDataRef.current = isSameData;
    eventTypesRef.current = eventTypes;

    trySubscribe();

    return () => {
      tryUnsubscribe();
    };
  }, [trySubscribe, tryUnsubscribe, getData, isSameData, eventTypes]);

  return hookResultRef.current;
};
