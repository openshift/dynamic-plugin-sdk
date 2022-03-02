import type { ActionType as Action } from 'typesafe-actions';
import type { CoreState } from '../../../../types/redux';

// TODO remove when actions/reducers are migrated
const emptyCoreState: CoreState = {
  user: { apiVersion: '', kind: '', identities: [] },
  activeCluster: '',
};

type CoreAction = Action<typeof Object>;

export const coreReducer = (state: CoreState | undefined, action: CoreAction): CoreState => {
  return state || action ? emptyCoreState : emptyCoreState;
};
