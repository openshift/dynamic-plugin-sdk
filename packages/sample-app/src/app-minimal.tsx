// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types.d.ts" />

import { PluginLoader, PluginStore, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import type { PluginStoreOptions } from '@openshift/dynamic-plugin-sdk';
import '@patternfly/react-core/dist/styles/base.css';
import * as React from 'react';
import { render } from 'react-dom';
import './app-minimal.css';
import MinimalAppPage from './components/app-minimal/MinimalAppPage';
import { setFlagsForSampleApp, getFlagsForSampleApp } from './components/common/AppFeatureFlags';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loading from './components/common/Loading';
import PageHeader from './components/common/PageHeader';
import PageLayout from './components/common/PageLayout';
import { initSharedScope, getSharedScope } from './shared-scope';

const appContainer = document.getElementById('app');

render(<Loading />, appContainer);

// eslint-disable-next-line promise/catch-or-return, promise/always-return
initSharedScope().then(() => {
  const pluginLoader = new PluginLoader({ sharedScope: getSharedScope() });

  setFlagsForSampleApp(['SHOW_NAV', 'TELEMETRY_FLAG']); // Setting some sample feature flags for the application
  const pluginStoreOptions: PluginStoreOptions = {
    isFeatureFlagEnabled: (flag: string) => {
      const flagsForSampleApp = getFlagsForSampleApp();
      return flagsForSampleApp.includes(flag);
    },
  };
  const pluginStore = new PluginStore(pluginStoreOptions);

  pluginLoader.registerPluginEntryCallback();
  pluginStore.setLoader(pluginLoader);

  render(
    <PluginStoreProvider store={pluginStore}>
      <ErrorBoundary>
        <PageLayout header={<PageHeader />}>
          <MinimalAppPage />
        </PageLayout>
      </ErrorBoundary>
    </PluginStoreProvider>,
    appContainer,
  );
});
