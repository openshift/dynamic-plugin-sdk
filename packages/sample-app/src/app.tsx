import { PluginStore, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { render } from 'react-dom';
import '@patternfly/react-core/dist/styles/base.css';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';
import PageContent from './components/PageContent';
import PageHeader from './components/PageHeader';
import PageLayout from './components/PageLayout';
import { initSharedScope, getSharedScope } from './shared-scope';

const appContainer = document.getElementById('root');

render(<Loading />, appContainer);

// eslint-disable-next-line promise/catch-or-return, promise/always-return
initSharedScope().then(() => {
  const pluginStore = new PluginStore({
    loaderOptions: {
      sharedScope: getSharedScope(),
      customDependencyResolutions: { 'sample-app': '1.0.0' },
    },
  });

  pluginStore.setFeatureFlags({ TELEMETRY_FLAG: true });

  // eslint-disable-next-line no-console
  console.info(`Using plugin SDK runtime version ${pluginStore.sdkVersion}`);

  render(
    <PluginStoreProvider store={pluginStore}>
      <ErrorBoundary>
        <PageLayout header={<PageHeader />}>
          <PageContent />
        </PageLayout>
      </ErrorBoundary>
    </PluginStoreProvider>,
    appContainer,
  );
});
