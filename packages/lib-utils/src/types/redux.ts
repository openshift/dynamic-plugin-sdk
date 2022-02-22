import type { Map as ImmutableMap } from 'immutable';
import type { K8sResourceCommon } from './k8s';

export type K8sState = ImmutableMap<string, unknown>;

export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type ImpersonateKind = {
  kind: string;
  name: string;
  subprotocols: string[];
};

export type CoreState = {
  activeCluster?: string;
  user?: UserKind;
  impersonate?: ImpersonateKind;
};

export type SDKStoreState = {
  sdkCore: CoreState;
  k8s: K8sState;
};
