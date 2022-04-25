import { Map as ImmutableMap } from 'immutable';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as k8sActions from '../../app/redux/actions/k8s';
import { getActiveCluster } from '../../app/redux/reducers/core';
import type { K8sModelCommon } from '../../types/k8s';
import type { K8sState, SDKStoreState } from '../../types/redux';
import {
  transformGroupVersionKindToReference,
  getReferenceForModel,
  getGroupVersionKindForReference,
} from '../k8s-utils';
import type { GetWatchData } from './k8s-watch-types';
import { getWatchData, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';
import type {
  ResourcesObject,
  WatchK8sResources,
  WatchK8sResultsObject,
  WatchK8sResults,
} from './watch-resource-types';

/**
 * Hook that retrieves the k8s resources along with their respective status for loaded and error.
 * @param initResources resources need to be watched as key-value pair, wherein key will be unique to resource and value will be options needed to watch for the respective resource.
 * @return A map where keys are as provided in initResouces and value has three properties data, loaded and error.
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const watchResources = {
        'deployment': {...},
        'pod': {...}
        ...
      }
 *   const {deployment, pod} = useK8sWatchResources(watchResources)
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
): WatchK8sResults<R> => {
  const cluster = useSelector((state: SDKStoreState) => getActiveCluster(state));
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<SDKStoreState, ImmutableMap<string, K8sModelCommon>>(
    (state: SDKStoreState) => state.k8s?.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  // Ref to immutable map mapping model's kind (string) to the model object (ImmutableMap)
  const k8sModelsRef = React.useRef<ImmutableMap<string, K8sModelCommon>>(ImmutableMap());

  if (
    prevResources !== resources ||
    (prevK8sModels !== allK8sModels &&
      Object.values(resources).some((r) => {
        // TODO: Use model in lieu of modelReference
        const modelReference = transformGroupVersionKindToReference(r.groupVersionKind || r.kind);
        return prevK8sModels?.get(modelReference) !== allK8sModels?.get(modelReference);
      }))
  ) {
    // String array containing list of model kinds/GVK based on input resources
    const requiredModels = Object.values(resources).map((r) =>
      transformGroupVersionKindToReference(r.groupVersionKind || r.kind),
    );

    // Filter all models to get the specific models required for the watched resources
    k8sModelsRef.current = allK8sModels.filter((model) => {
      return model
        ? requiredModels.includes(getReferenceForModel(model)) ||
            requiredModels.includes(model.kind)
        : false;
    }) as ImmutableMap<string, K8sModelCommon>;
  }

  // Contains mapping of model's kind/GVK (string) to the specific model objects to be watched (ImmutableMap)
  const k8sModels = k8sModelsRef.current;

  type WatchModel = ReturnType<GetWatchData> & { noModel: boolean };

  // reduxIDs -- Map of keys from "resources" to the {id, action} for watching the specific resource
  const reduxIDs = React.useMemo<{
    [key: string]: WatchModel;
  } | null>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce(
            (
              ids: {
                [key: string]: WatchModel;
              } | null,
              key,
            ) => {
              const r = resources[key];
              const modelReference = transformGroupVersionKindToReference(
                r.groupVersionKind || r.kind,
              );

              const resourceModel =
                k8sModels.get(modelReference) ||
                k8sModels.get(getGroupVersionKindForReference(modelReference).kind);
              if (!resourceModel && ids) {
                // eslint-disable-next-line no-param-reassign
                ids[key] = {
                  noModel: true,
                } as WatchModel;
              } else if (ids) {
                const watchData = getWatchData(resources[key], resourceModel, cluster);
                if (watchData) {
                  // eslint-disable-next-line no-param-reassign
                  ids[key] = watchData as WatchModel;
                }
              }
              return ids;
            },
            {},
          )
        : null,
    [k8sModels, modelsLoaded, resources, cluster],
  );

  // Dispatch action to watchResource (with cleanup for stopping the watch) for each resource in "resources"
  const dispatch = useDispatch();
  React.useEffect(() => {
    const reduxIDKeys = Object.keys(reduxIDs || {});
    reduxIDKeys.forEach((k) => {
      if (reduxIDs?.[k] && reduxIDs[k].action) {
        dispatch(reduxIDs[k].action);
      }
    });
    return () => {
      reduxIDKeys.forEach((k) => {
        if (reduxIDs?.[k] && reduxIDs[k].action) {
          dispatch(k8sActions.stopK8sWatch(reduxIDs[k].id));
        }
      });
    };
  }, [dispatch, reduxIDs]);

  // Create selector to select k8s from the store on each update of reduxIDs
  const resourceK8sSelectorCreator = React.useCallback(
    (oldK8s: K8sState, newK8s: K8sState) =>
      Object.values(reduxIDs || {})
        .filter(({ noModel }) => !noModel)
        .every(({ id }) => oldK8s?.get(id) === newK8s?.get(id)),
    [reduxIDs],
  );

  const resourceK8s = useSelector((state: SDKStoreState) => state.k8s, resourceK8sSelectorCreator);

  const results = React.useMemo(
    () =>
      Object.keys(resources).reduce<WatchK8sResults<R>>((acc, key) => {
        const accKey = key as keyof R;
        if (reduxIDs?.[key].noModel) {
          acc[accKey] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          } as WatchK8sResultsObject<R[typeof key]>;
        } else if (reduxIDs && resourceK8s?.has(reduxIDs?.[key].id)) {
          const data = getReduxData(resourceK8s.getIn([reduxIDs[key].id, 'data']), resources[key]);
          const loaded = resourceK8s.getIn([reduxIDs[key].id, 'loaded']);
          const loadError = resourceK8s.getIn([reduxIDs[key].id, 'loadError']);
          acc[accKey] = { data, loaded, loadError };
        } else {
          acc[accKey] = {
            data: resources[key].isList ? [] : {},
            loaded: false,
            loadError: undefined,
          } as WatchK8sResultsObject<R[typeof key]>;
        }
        return acc;
      }, {} as WatchK8sResults<R>),
    [resources, reduxIDs, resourceK8s],
  );
  return results;
};