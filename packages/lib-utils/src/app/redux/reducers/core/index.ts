import type { ActionType as Action } from 'typesafe-actions';
import type { CoreState, GetImpersonate, GetCluster } from '../../../../types/redux';

// TODO remove when actions/reducers are migrated
const emptyCoreState: CoreState = {
  user: { apiVersion: '', kind: '', identities: [] },
  activeCluster: '',
};

type CoreAction = Action<typeof Object>;

export const coreReducer = (state: CoreState | undefined, action: CoreAction): CoreState => {
  return state || action ? emptyCoreState : emptyCoreState;
};

/**
 * It provides impersonation details from the redux store.
 * @param state the root state
 * @return The the impersonate state.
 * * */
export const getImpersonate: GetImpersonate = (state) => state.sdkCore.impersonate;

/**
 * It provides current active cluster.
 * @param state the root state
 * @return The the current active cluster.
 * * */
export const getActiveCluster: GetCluster = (state) =>
  state?.sdkCore?.activeCluster || 'local-cluster';
