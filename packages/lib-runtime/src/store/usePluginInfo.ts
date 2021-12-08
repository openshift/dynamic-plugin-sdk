import * as _ from 'lodash-es';
import type { PluginInfoEntry, PluginConsumer } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

const getData = (pluginConsumer: PluginConsumer) => pluginConsumer.getPluginInfo();

const eventTypes = [PluginEventType.PluginInfoChanged];

/**
 * React hook for consuming current information about plugins.
 *
 * This hook re-renders the component whenever the plugin information changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 */
export const usePluginInfo = (): PluginInfoEntry[] => {
  return usePluginSubscription(getData, _.isEqual, eventTypes);
};
