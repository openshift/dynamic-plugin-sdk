import { Map as ImmutableMap, fromJS } from 'immutable';
import type { ActionType as Action } from 'typesafe-actions';
import type { K8sModelCommon } from '../../../../types/k8s';
import type { K8sState } from '../../../../types/redux';

// TODO remove when actions/reducers are migrated
const emptyK8sState: K8sState = fromJS({
  RESOURCES: { inFlight: false, models: ImmutableMap<string, K8sModelCommon>() },
});

type K8sAction = Action<typeof Object>;

export const sdkK8sReducer = (state: K8sState | undefined, action: K8sAction): K8sState => {
  return state || action ? emptyK8sState : emptyK8sState;
};
