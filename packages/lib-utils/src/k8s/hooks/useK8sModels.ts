import type { Map as ImmutableMap } from 'immutable';
import { useSelector } from 'react-redux';
import type { K8sModelCommon } from '../../types/k8s';
import type { SDKStoreState } from '../../types/redux';
import type { UseK8sModels } from './use-model-types';

/**
 * Hook that retrieves all current k8s models from redux.
 *
 * @returns An array with the first item as the list of k8s model and second item as inFlight status
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const [models, inFlight] = UseK8sModels();
 *   return ...
 * }
 * ```
 */
export const useK8sModels: UseK8sModels = () => [
  useSelector<SDKStoreState, ImmutableMap<string, { [key: string]: K8sModelCommon }>>(({ k8s }) =>
    k8s?.getIn(['RESOURCES', 'models']),
  )?.toJS() ?? {},
  useSelector<SDKStoreState, boolean>(({ k8s }) => k8s?.getIn(['RESOURCES', 'inFlight'])) ?? false,
];
