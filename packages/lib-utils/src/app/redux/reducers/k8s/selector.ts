import type { K8sState, SDKStoreState } from '../../../../types/redux';

export const getReduxIdPayload = (state: SDKStoreState, reduxId: string) =>
  state?.k8s?.get(reduxId);

export const getK8sDataById = (state: K8sState, id: string) => state?.getIn([id, 'data']);
