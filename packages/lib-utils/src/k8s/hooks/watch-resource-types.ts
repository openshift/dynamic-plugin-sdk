import type { EitherNotBoth } from '@openshift/dynamic-plugin-sdk';
import type {
  K8sGroupVersionKind,
  K8sResourceCommon,
  K8sResourceKindReference,
  Selector,
} from '../../types/k8s';

export type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [
  data: R,
  loaded: boolean,
  loadError: unknown,
];

export type WatchK8sResultsObject<R extends K8sResourceCommon | K8sResourceCommon[]> = {
  data: R;
  loaded: boolean;
  loadError: unknown;
};

export type WatchK8sResults<R extends ResourcesObject> = {
  [K in keyof R]: WatchK8sResultsObject<R[K]>;
};

export type WatchK8sResource = EitherNotBoth<
  { kind: K8sResourceKindReference },
  { groupVersionKind: K8sGroupVersionKind }
> & {
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  namespaced?: boolean;
  limit?: number;
  fieldSelector?: string;
  optional?: boolean;
  partialMetadata?: boolean;
};

export type ResourcesObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

export type WatchK8sResources<R extends ResourcesObject> = {
  [K in keyof R]: WatchK8sResource;
};
