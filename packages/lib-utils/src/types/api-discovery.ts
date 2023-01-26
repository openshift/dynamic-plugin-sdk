import type { Store, AnyAction } from 'redux';
import type { ActionType as Action } from 'typesafe-actions';
import type { K8sVerb, K8sModelCommon } from './k8s';

export type InitAPIDiscovery = (
  store: Store<unknown, Action<AnyAction>>,
  preferenceList?: string[],
) => void;

export type APIResourceList = K8sModelCommon & {
  kind: 'APIResourceList';
  apiVersion: 'v1';
  groupVersion: string;
  resources?: {
    name: string;
    singularName?: string;
    namespaced?: boolean;
    kind: string;
    verbs: K8sVerb[];
    shortNames?: string[];
  }[];
};

export type DiscoveryResources = {
  adminResources: string[];
  allResources: string[];
  configResources: K8sModelCommon[];
  clusterOperatorConfigResources: K8sModelCommon[];
  models: K8sModelCommon[];
  namespacedSet: Set<string>;
  safeResources: string[];
  groupVersionMap: {
    [key: string]: {
      versions: string[];
      preferredVersion: string;
    };
  };
};

export type APIActions = {
  setResourcesInFlight: (isInFlight: boolean) => void;
  setBatchesInFlight: (isInFlight: boolean) => void;
  receivedResources: (resource: DiscoveryResources) => void;
};
