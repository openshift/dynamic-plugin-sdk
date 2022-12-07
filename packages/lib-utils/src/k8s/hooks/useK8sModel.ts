import { useSelector } from 'react-redux';
import type {
  K8sGroupVersionKind,
  K8sModelCommon,
  K8sResourceKindReference,
} from '../../types/k8s';
import type { K8sState, SDKStoreState } from '../../types/redux';
import {
  getGroupVersionKindForReference,
  transformGroupVersionKindToReference,
} from '../k8s-utils';
import type { UseK8sModel } from './use-model-types';

export const getK8sModel = (
  k8s: K8sState,
  k8sGroupVersionKind: K8sResourceKindReference | K8sGroupVersionKind,
): K8sModelCommon => {
  const kindReference = transformGroupVersionKindToReference(k8sGroupVersionKind);
  return kindReference
    ? k8s?.getIn(['RESOURCES', 'models', kindReference]) ??
        k8s?.getIn(['RESOURCES', 'models', getGroupVersionKindForReference(kindReference).kind])
    : undefined;
};

/**
 * Hook that retrieves the k8s model for provided K8sGroupVersionKind from redux.
 * @param k8sGroupVersionKind - group, version, kind of k8s resource {@link K8sGroupVersionKind} is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` {@link K8sResourceKindReference}.
 * @returns An array with the first item as k8s model and second item as inFlight status
 *
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const [model, inFlight] = useK8sModel({ group: 'app'; version: 'v1'; kind: 'Deployment' });
 *   return ...
 * }
 * ```
 */
export const useK8sModel: UseK8sModel = (k8sGroupVersionKind) => [
  useSelector<SDKStoreState, K8sModelCommon>(({ k8s }) => getK8sModel(k8s, k8sGroupVersionKind)),
  useSelector<SDKStoreState, boolean>(({ k8s }) => k8s?.getIn(['RESOURCES', 'inFlight']) ?? false),
];
