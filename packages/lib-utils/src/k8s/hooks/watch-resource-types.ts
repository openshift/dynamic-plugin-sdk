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

/** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
type UseKind = {
  kind: K8sResourceKindReference;
  groupVersionKind?: never;
};
type UseKindReference = {
  groupVersionKind: K8sGroupVersionKind;
  kind?: never;
};

export type WatchK8sResource = (UseKind | UseKindReference) & {
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  namespaced?: boolean;
  limit?: number;
  fieldSelector?: string;
  optional?: boolean;
  partialMetadata?: boolean;
  cluster?: string;
};

export type ResourcesObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

export type WatchK8sResources<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResource;
};

export type UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource,
) => WatchK8sResult<R>;

export type UseK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
) => WatchK8sResults<R>;
