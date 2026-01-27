import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import { isReduxProvider } from '@openshift/dynamic-plugin-sdk-extensions';
import type { ReduxProvider } from '@openshift/dynamic-plugin-sdk-extensions';
import type { PropsWithChildren, FC } from 'react';
import { Provider } from 'react-redux';

/**
 * Renders a Redux.Provider for each `core.redux-provider` extension.
 * Should be rendered near the root of the application.
 */
const ReduxExtensionProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
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
