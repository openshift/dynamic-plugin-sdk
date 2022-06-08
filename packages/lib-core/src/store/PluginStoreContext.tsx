import * as _ from 'lodash-es';
import * as React from 'react';
import type { PluginConsumer, PluginManager, FeatureFlags } from '../types/store';
import { PluginEventType } from '../types/store';
import type { PluginStore } from './PluginStore';
import { usePluginSubscription } from './usePluginSubscription';

const PluginStoreContext = React.createContext<PluginStore | undefined>(undefined);

const eventTypes = [PluginEventType.FeatureFlagsChanged];

const isSameData = (prevData: boolean, nextData: boolean) => prevData === nextData;

/**
 * React Context provider for passing the {@link PluginStore} down the component tree.
 */
export const PluginStoreProvider: React.FC<PluginStoreProviderProps> = ({ store, children }) => {
  if (!store.hasLoader()) {
    throw new Error('PluginLoader must be set on the PluginStore');
  }

  return <PluginStoreContext.Provider value={store}>{children}</PluginStoreContext.Provider>;
};

export type PluginStoreProviderProps = React.PropsWithChildren<{
  store: PluginStore;
}>;

/**
 * React hook that provides access to the {@link PluginStore} functionality.
 */
export const usePluginStore = (): PluginConsumer & PluginManager => {
  const store = React.useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginStore hook called outside a PluginStoreProvider');
  }

  return store;
};

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
// TODO: this hook can be moved to a separate file
export const useFeatureFlag = (name: string): UseFeatureFlagResult => {
  const getData = React.useCallback(
    (pluginConsumer: PluginConsumer) => pluginConsumer.getFeatureFlags()[name],
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
