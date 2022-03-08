import type {
  K8sGroupVersionKind,
  K8sModelCommon,
  K8sResourceKindReference,
} from '../../types/k8s';

export type UseK8sModel = (
  // Use K8sGroupVersionKind type instead of K8sResourceKindReference. Support for type K8sResourceKindReference will be removed in a future release.
  groupVersionKind: K8sResourceKindReference | K8sGroupVersionKind,
) => [K8sModelCommon, boolean];

export type UseK8sModels = () => [{ [key: string]: K8sModelCommon }, boolean];
