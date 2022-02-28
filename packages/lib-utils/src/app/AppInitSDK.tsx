import { consoleLogger } from '@monorepo/common';
import * as React from 'react';
import { Provider } from 'react-redux';
import type { UtilsConfig } from '../config';
import { setUtilsConfig } from '../config';
import type { InitAPIDiscovery } from '../types/api-discovery';
import { initAPIDiscovery } from './api-discovery';
import { useReduxStore } from './redux';

type AppInitSDKProps = {
  /** Only child is your Application */
  children: React.ReactElement;
  configurations: {
    apiDiscovery?: InitAPIDiscovery;
    appFetch: UtilsConfig['appFetch'];
  };
};

/**
 * Component for providing store access to the SDK.
 * Add this at app-level to make use of app's redux store and pass configurations prop needed to initialize the app, preferred to have it under Provider.
 * It checks for store instance if present or not.
 * If the store is there then the reference is persisted to be used in SDK else it creates a new store and passes it to the children with the provider
 * @component AppInitSDK
 * @example
 * ```ts
 * return (
 *  <Provider store={store}>
 *   <AppInitSDK configurations={{ appFetch, apiDiscovery }}>
 *      <App />
 *   </AppInitSDK>
 *  </Provider>
 * )
 * ```
 */
const AppInitSDK: React.FC<AppInitSDKProps> = ({ children, configurations }) => {
  const { store, storeContextPresent } = useReduxStore();
  const { appFetch, apiDiscovery = initAPIDiscovery } = configurations;
  React.useEffect(() => {
    try {
      setUtilsConfig({ appFetch });
      apiDiscovery(store);
    } catch (e) {
      consoleLogger.warn(e);
    }
  }, [apiDiscovery, appFetch, store]);

  return !storeContextPresent ? <Provider store={store}>{children}</Provider> : children;
};

export default AppInitSDK;
