import * as _ from 'lodash-es';
import type { PluginInfoEntry, PluginStoreInterface } from '../types/store';
import { PluginEventType } from '../types/store';
import { usePluginSubscription } from './usePluginSubscription';

const eventTypes = [PluginEventType.PluginInfoChanged];

const getData = (pluginStore: PluginStoreInterface) => pluginStore.getPluginInfo();

/**
 * React hook for consuming current information about plugins.
 *
 * This hook re-renders the component whenever the plugin information changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 */
export const usePluginInfo = (): PluginInfoEntry[] => {
  return usePluginSubscription(eventTypes, getData, _.isEqual);
};
