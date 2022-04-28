import type { Map as ImmutableMap } from 'immutable';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

export type K8sState = ImmutableMap<string, unknown> | undefined;

export type SDKStoreState = {
  k8s: K8sState;
};

export type DispatchWithThunk = ThunkDispatch<SDKStoreState, undefined, AnyAction>;

export type GetState = () => SDKStoreState;

export type ThunkDispatchFunction = (dispatch: DispatchWithThunk, state: GetState) => void;
