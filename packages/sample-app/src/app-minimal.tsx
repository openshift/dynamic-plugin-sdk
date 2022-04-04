// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types.d.ts" />

import '@patternfly/react-core/dist/styles/base.css';
import './app-minimal.css';

import * as React from 'react';
import { render } from 'react-dom';
import MinimalAppInit from './components/app-minimal/MinimalAppInit';
import MinimalAppPage from './components/app-minimal/MinimalAppPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loading from './components/common/Loading';
import PageHeader from './components/common/PageHeader';
import PageLayout from './components/common/PageLayout';

const App: React.FC = () => (
  <ErrorBoundary>
    <React.Suspense fallback={<Loading />}>
      <MinimalAppInit>
        <PageLayout header={<PageHeader />}>
          <MinimalAppPage />
        </PageLayout>
      </MinimalAppInit>
    </React.Suspense>
  </ErrorBoundary>
);

render(<App />, document.getElementById('app'));
