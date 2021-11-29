import * as React from 'react';
import { PluginStore, PluginStoreClient } from './PluginStore';

const PluginStoreContext = React.createContext<PluginStore | undefined>(undefined);

/**
 * React Context provider for passing the `PluginStore` down the component tree.
 */
export const PluginStoreProvider: React.FC<PluginStoreProviderProps> = ({ store, children }) => {
  if (!store.hasLoader()) {
    throw new Error('PluginLoader must be set on the PluginStore');
  }

  return <PluginStoreContext.Provider value={store}>{children}</PluginStoreContext.Provider>;
};

type PluginStoreProviderProps = React.PropsWithChildren<{
  store: PluginStore;
}>;

/**
 * React hook for consuming the `PluginStore` via its client interface.
 */
export const usePluginStore = (): PluginStoreClient => {
  const store = React.useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginStore hook called outside a PluginStoreProvider');
  }

  return store;
};
