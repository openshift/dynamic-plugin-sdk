import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { PluginStoreInterface } from '../types/store';

const PluginStoreContext = createContext<PluginStoreInterface | undefined>(undefined);

/**
 * React Context provider for passing the {@link PluginStore} down the component tree.
 */
export const PluginStoreProvider: FC<PluginStoreProviderProps> = ({ store, children }) => (
  <PluginStoreContext.Provider value={store}>{children}</PluginStoreContext.Provider>
);

export type PluginStoreProviderProps = PropsWithChildren<{
  store: PluginStoreInterface;
}>;

/**
 * React hook that provides access to the {@link PluginStore} functionality.
 */
export const usePluginStore = () => {
  const store = useContext(PluginStoreContext);

  if (store === undefined) {
    throw new Error('usePluginStore hook called outside a PluginStoreProvider');
  }

  return store;
};
