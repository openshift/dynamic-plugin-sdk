import { PluginStore, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { createRoot } from 'react-dom/client';
import '@patternfly/react-core/dist/styles/base.css';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';
import PageContent from './components/PageContent';
import PageHeader from './components/PageHeader';
import PageLayout from './components/PageLayout';
import { initSharedScope, getSharedScope } from './shared-scope';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!);

root.render(<Loading />);

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

  root.render(
    <PluginStoreProvider store={pluginStore}>
      <ErrorBoundary>
        <PageLayout header={<PageHeader />}>
          <PageContent />
        </PageLayout>
      </ErrorBoundary>
    </PluginStoreProvider>,
  );
});
