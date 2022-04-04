import { PluginLoader, PluginStore, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { initSharedScope, getSharedScope } from '../../shared-scope';

const MinimalAppInit = React.lazy(async () => {
  await initSharedScope();

  const pluginLoader = new PluginLoader({ sharedScope: getSharedScope() });
  const pluginStore = new PluginStore();

  pluginLoader.registerPluginEntryCallback();
  pluginStore.setLoader(pluginLoader);

  const App: React.FC = ({ children }) => (
    <PluginStoreProvider store={pluginStore}>{children}</PluginStoreProvider>
  );

  return { default: App };
});

export default MinimalAppInit;
