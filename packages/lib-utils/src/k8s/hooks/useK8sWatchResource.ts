import type { Map as ImmutableMap } from 'immutable';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as k8sActions from '../../app/redux/actions/k8s';
import { getReduxIdPayload } from '../../app/redux/reducers/k8s/selector';
import type { K8sResourceCommon } from '../../types/k8s';
import type { SDKStoreState } from '../../types/redux';
import type { WebSocketOptions } from '../../web-socket/types';
import { getWatchData, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';
import type { WatchK8sResource, WatchK8sResult } from './watch-resource-types';

const NOT_A_VALUE = '__not-a-value__';

/**
 * Hook that retrieves the k8s resource along with status for loaded and error.
 * @param initResource options needed to watch for resource.
 * @param options WS and fetch options passed down to WSFactory @see {@link WebSocketFactory} and when pulling the first item.
 * @return An array with first item as resource(s), second item as loaded status and third item as error state if any.
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const watchRes = {
        ...
      }
 *   const [data, loaded, error] = useK8sWatchResource(watchRes, { wsPrefix: 'wss://localhost:1337/foo' })
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource | null,
  options?: Partial<WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
): WatchK8sResult<R> => {
  const withFallback: WatchK8sResource = initResource || { kind: NOT_A_VALUE };
  const resource = useDeepCompareMemoize(withFallback, true);
  const modelsLoaded = useModelsLoaded();

  const [k8sModel] = useK8sModel(resource.groupVersionKind || resource.kind);

  const watchData = React.useMemo(
    () => getWatchData(resource, k8sModel, options),
    [k8sModel, resource, options],
  );

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (watchData) {
      dispatch(watchData.action);
    }
    return () => {
      if (watchData) {
        dispatch(k8sActions.stopK8sWatch(watchData.id));
      }
    };
  }, [dispatch, watchData]);

  const resourceK8s = useSelector<SDKStoreState, unknown>((state) =>
    watchData ? getReduxIdPayload(state, watchData.id) : null,
  ) as ImmutableMap<string, unknown>; // TODO: Store state based off of Immutable is problematic

  const batchesInFlight = useSelector<SDKStoreState, boolean>(({ k8s }) =>
    k8s?.getIn(['RESOURCES', 'batchesInFlight']),
  );

  return React.useMemo(() => {
    if (!resource || resource.kind === NOT_A_VALUE) {
      return [undefined, true, undefined];
    }
    if (!resourceK8s) {
      const data = resource.isList ? [] : {};
      return modelsLoaded && !k8sModel && !batchesInFlight
        ? [data, true, new NoModelError()]
        : [data, false, undefined];
    }

    const data = getReduxData(resourceK8s.get('data'), resource);
    const loaded = resourceK8s.get('loaded') as boolean;
    const loadError = resourceK8s.get('loadError');
    return [data, loaded, loadError];
  }, [resource, resourceK8s, modelsLoaded, k8sModel, batchesInFlight]);
};
