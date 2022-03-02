import type { K8sVerb } from '@openshift/dynamic-plugin-sdk/src/types/core';
import type { Store, AnyAction } from 'redux';
import type { ActionType as Action } from 'typesafe-actions';
import type { K8sModelCommon } from './k8s';

export type InitAPIDiscovery = (store: Store<unknown, Action<AnyAction>>) => void;

export type APIResourceList = K8sModelCommon & {
  kind: 'APIResourceList';
  apiVersion: 'v1';
  resources?: {
    name: string;
    singularName?: string;
    namespaced?: boolean;
    kind: string;
    verbs: K8sVerb[];
    shortNames?: string[];
  }[];
};
