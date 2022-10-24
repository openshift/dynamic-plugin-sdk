import { consoleLogger, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import type { PluginStore } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { Provider } from 'react-redux';
import type { UtilsConfig } from '../config';
import { isUtilsConfigSet, setUtilsConfig } from '../config';
import type { InitAPIDiscovery } from '../types/api-discovery';
import { initAPIDiscovery } from './api-discovery';
import { useReduxStore } from './redux';

export type AppInitSDKProps = {
  configurations: {
    apiDiscovery?: InitAPIDiscovery;
    apiPriorityList?: string[];
    appFetch: UtilsConfig['appFetch'];
    pluginStore: PluginStore;
    wsAppSettings: UtilsConfig['wsAppSettings'];
  };
};

/**
 * Initializes the host application to work with Kubernetes and related SDK utilities.
 * Add this at app-level to make use of app's redux store and pass configurations prop needed to initialize the app, preferred to have it under Provider.
 * It checks for store instance if present or not.
 * If the store is there then the reference is persisted to be used in SDK else it creates a new store and passes it to the children with the provider
 *
 * @example
 * ```tsx
 * return (
 *  <Provider store={store}>
 *   <AppInitSDK configurations={{ appFetch, pluginStore, wsAppSettings }}>
 *      <App />
 *   </AppInitSDK>
 *  </Provider>
 * )
 * ```
 */
const AppInitSDK: React.FC<AppInitSDKProps> = ({ children, configurations }) => {
  const { store, storeContextPresent } = useReduxStore();

  const {
    appFetch,
    pluginStore,
    wsAppSettings,
    apiDiscovery = initAPIDiscovery,
    apiPriorityList,
  } = configurations;

  React.useEffect(() => {
    try {
      if (!isUtilsConfigSet()) {
        setUtilsConfig({ appFetch, wsAppSettings });
      }
      apiDiscovery(store, apiPriorityList);
    } catch (e) {
      consoleLogger.warn('Error while initializing AppInitSDK', e);
    }
  }, [apiDiscovery, appFetch, store, wsAppSettings, apiPriorityList]);

  return (
    <PluginStoreProvider store={pluginStore}>
      {!storeContextPresent ? <Provider store={store}>{children}</Provider> : children}
    </PluginStoreProvider>
  );
};

export default AppInitSDK;
