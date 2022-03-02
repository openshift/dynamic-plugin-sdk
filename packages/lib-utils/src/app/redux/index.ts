import { consoleLogger } from '@monorepo/common';
import * as React from 'react';
import { useStore } from 'react-redux';
import type { Store } from 'redux';
import { applyMiddleware, combineReducers, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { setReduxStore, getReduxStore } from '../../config';
import type { SDKStoreState } from '../../types/redux';
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
  const storeContext = useStore();
  const [storeContextPresent, setStoreContextPresent] = React.useState(false);
  const store = React.useMemo(() => {
    if (storeContext) {
      setStoreContextPresent(true);
      setReduxStore(storeContext);
    } else {
      consoleLogger.info('Creating the SDK redux store');
      setStoreContextPresent(false);
      const storeInstance = createStore(
        combineReducers<SDKStoreState>(SDKReducers),
        {},
        compose(applyMiddleware(thunk)),
      );
      setReduxStore(storeInstance);
    }
    return getReduxStore();
  }, [storeContext]);

  return { store, storeContextPresent };
};
