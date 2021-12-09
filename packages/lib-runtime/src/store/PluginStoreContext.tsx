import * as React from 'react';
import type { PluginConsumer, PluginManager } from '../types/store';
import { createMethodDelegate } from '../utils/objects';
import type { PluginStore } from './PluginStore';

const PluginStoreContext = React.createContext<PluginStore | undefined>(undefined);

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
 * React hook for exposing the {@link PluginConsumer} interface.
 */
export const usePluginConsumer = (): PluginConsumer => {
  const store = React.useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginConsumer hook called outside a PluginStoreProvider');
  }

  return React.useMemo(
    () => createMethodDelegate(store, ['subscribe', 'getExtensions', 'getPluginInfo']),
    [store],
  );
};

/**
 * React hook for exposing the {@link PluginManager} interface.
 */
export const usePluginManager = (): PluginManager => {
  const store = React.useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginManager hook called outside a PluginStoreProvider');
  }

  return React.useMemo(
    () => createMethodDelegate(store, ['loadPlugin', 'setPluginEnabled']),
    [store],
  );
};
