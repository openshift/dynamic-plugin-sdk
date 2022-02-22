import type { Reducer } from 'redux';
import type { CodeRef, Extension } from '../types/extension';

/** Adds new reducer to host application's Redux store which operates on `plugins.<scope>` substate. */
export type ReduxReducer = Extension<
  'core.redux-reducer',
  {
    /** The key to represent the reducer-managed substate within the Redux state object. */
    scope: string;
    /** The reducer function, operating on the reducer-managed substate. */
    reducer: CodeRef<Reducer>;
  }
>;

// Type guards

export const isReduxReducer = (e: Extension): e is ReduxReducer => e.type === 'core.redux-reducer';
