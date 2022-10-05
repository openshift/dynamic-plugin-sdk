import type { CodeRef, Extension } from '@openshift/dynamic-plugin-sdk';
import type { ReactReduxContextValue } from 'react-redux';
import type { Reducer, Store } from 'redux';

/**
 * Adds new reducer to host application's Redux store which operates on `plugins.<scope>` substate.
 *
 * @deprecated use the `core.redux-provider` extension instead
 */
export type ReduxReducer = Extension<
  'core.redux-reducer',
  {
    /** The key to represent the reducer-managed substate within the Redux state object. */
    scope: string;
    /** The reducer function, operating on the reducer-managed substate. */
    reducer: CodeRef<Reducer>;
  }
>;

/** Provides a configuration for establishing new Redux store instance scoped to the contributing plugin.  */
export type ReduxProvider = Extension<
  'core.redux-provider',
  {
    /** The configured Redux store object; configured with reducers, middleware, etc... */
    store: CodeRef<Store>;
    /** The Redux React context object for which the instance will be scoped to. */
    context: CodeRef<React.Context<ReactReduxContextValue>>;
  }
>;

// Type guards

/**
 * @deprecated use the `core.redux-provider` extension instead
 */
export const isReduxReducer = (e: Extension): e is ReduxReducer => e.type === 'core.redux-reducer';

export const isReduxProvider = (e: Extension): e is ReduxProvider =>
  e.type === 'core.redux-reducer';
