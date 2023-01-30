import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { useStore } from 'react-redux';
import type { Store } from 'redux';
import { applyMiddleware, combineReducers, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { setReduxStore, getReduxStore } from '../../config';
import { SDKReducers } from './reducers';

type UseReduxStoreResult = {
  store: Store<unknown>;
  storeContextPresent: boolean;
};

/**
 * `useReduxStore` will provide the store instance if present or else create one along with info if the context was present.
 *
 * @example
 * ```ts
 * function Component () {
 *   const {store, storeContextPresent} = useReduxStore()
 *   return ...
 * }
 * ```
 */
export const useReduxStore = (): UseReduxStoreResult => {
  let storeContext: Store | null = null;
  try {
    // It'll always be invoked -- it just might blow up
    // eslint-disable-next-line react-hooks/rules-of-hooks
    storeContext = useStore();
  } catch (e) {
    // TODO: remove once proven not needed (redux versioning issue)
    consoleLogger.error(e);
  }
  const [storeContextPresent, setStoreContextPresent] = React.useState(false);
  const store = React.useMemo(() => {
    if (storeContext) {
      setStoreContextPresent(true);
      setReduxStore(storeContext);
    } else {
      consoleLogger.info('Creating the SDK redux store');
      setStoreContextPresent(false);
      const storeInstance = createStore(
        combineReducers<typeof SDKReducers>(SDKReducers),
        {},
        compose(applyMiddleware(thunk)),
      );
      setReduxStore(storeInstance as unknown as Store);
    }
    return getReduxStore();
  }, [storeContext]);

  return { store, storeContextPresent };
};
