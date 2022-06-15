import { useResolvedExtensions, isReduxProvider } from '@openshift/dynamic-plugin-sdk';
import type { ReduxProvider } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { Provider } from 'react-redux';

/**
 * Renders a Redux.Provider for each `core.redux-provider` extension.
 * Should be rendered near the root of the application.
 */
const ReduxExtensionProvider: React.FC = ({ children }) => {
  const [reduxProviderExtensions, reduxProvidersResolved] =
    useResolvedExtensions<ReduxProvider>(isReduxProvider);

  return reduxProvidersResolved ? (
    <>
      {reduxProviderExtensions.reduce(
        (c, e) => (
          <Provider store={e.properties.store} context={e.properties.context}>
            {c}
          </Provider>
        ),
        children,
      )}
    </>
  ) : null;
};

export default ReduxExtensionProvider;
