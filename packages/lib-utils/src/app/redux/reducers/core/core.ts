import * as _ from 'lodash-es';
import type { CoreState } from '../../../../types/redux';
import type { CoreAction } from '../../actions/core';
import { ActionType } from '../../actions/core';

const emptyCoreState = { user: { identities: [], apiVersion: '', kind: '' }, activeCluster: '' };

/**
 * Reducer function for the core
 * @param state the reducer state
 * @param action provided associated action type alongwith payload
 * @param action.type type of the action
 * @param action.payload associated payload for the action
 * @see CoreAction
 * @return The the updated state.
 * * */
export const coreReducer = (state: CoreState, action: CoreAction): CoreState => {
  if (!state) {
    return emptyCoreState;
  }
  switch (action.type) {
    case ActionType.BeginImpersonate:
      return {
        ...state,
        impersonate: {
          kind: action.payload.kind,
          name: action.payload.name,
          subprotocols: action.payload.subprotocols,
        },
      };

    case ActionType.EndImpersonate:
      return _.omit(state, 'impersonate');

    case ActionType.SetUser:
      return {
        ...state,
        user: action.payload.user,
      };

    case ActionType.SetActiveCluster:
      return {
        ...state,
        activeCluster: action.payload.cluster,
      };

    default:
      return state;
  }
};
