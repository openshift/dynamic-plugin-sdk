import * as _ from 'lodash-es';
import * as React from 'react';
import type { PluginInfoEntry, PluginConsumer } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

/**
 * React hook for consuming current information about plugins.
 *
 * This hook re-renders the component whenever the plugin information changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 */
export const usePluginInfo = (): PluginInfoEntry[] => {
  const getData = React.useCallback(
    (pluginConsumer: PluginConsumer) => pluginConsumer.getPluginInfo(),
    [],
  );

  const eventTypes = React.useMemo(() => [PluginEventType.PluginInfoChanged], []);

  const infoEntries = usePluginSubscription(getData, _.isEqual, eventTypes);

  return infoEntries;
};
