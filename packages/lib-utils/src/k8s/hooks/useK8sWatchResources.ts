import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { K8sModelCommon } from '../../types/k8s';
import { getActiveCluster } from '../../app/redux/reducers/core';
import * as k8sActions from '../../app/redux/actions/k8s';
import { SDKStoreState } from '../../types/redux';
import { UseK8sWatchResources } from './watch-resource-types';
import {
  transformGroupVersionKindToReference,
  getReferenceForModel,
  getGroupVersionKindForReference,
} from '../k8s-utils';
import { GetWatchData, OpenShiftReduxRootState } from './k8s-watch-types';
import { getWatchData, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { getK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';

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
 *   const {deployment, pod}  = UseK8sWatchResources(watchResources)
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const cluster = useSelector((state: SDKStoreState) => getActiveCluster(state));
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<SDKStoreState, ImmutableMap<string, K8sModelCommon>>(({ k8s }) =>
    k8s?.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  // Ref to immutable map mapping model's kind (string) to the model object (ImmutableMap)
  const k8sModelsRef = React.useRef<ImmutableMap<string, K8sModelCommon>>(ImmutableMap());

  if (
    prevResources !== resources ||
    (prevK8sModels !== allK8sModels &&
      Object.values(resources).some((r) => {
        /**
         * Q - What is the guideline on functions like transformGroupVersionKindToReference that have been copied over but marked as deprecated?
         * There are TODOs indicating they will be obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind.
         * Is that for now or later?
         */
        const modelReference = transformGroupVersionKindToReference(r.groupVersionKind || r.kind);
        return (
          getK8sModel(prevK8sModels, modelReference) !== getK8sModel(allK8sModels, modelReference)
        );
      }))
  ) {
    // String array containing list of model kinds/GVK based on input resources
    const requiredModels = Object.values(resources).map((r) =>
      transformGroupVersionKindToReference(r.groupVersionKind || r.kind),
    );

    // Filter all models to get the specific models required for the watched resources
    k8sModelsRef.current = allK8sModels.filter((model) => {
      if (model) {
        return (
          requiredModels.includes(getReferenceForModel(model)) ||
          requiredModels.includes(model.kind)
        );
      }
    }) as ImmutableMap<string, K8sModelCommon>;
  }

  // Contains mapping of model's kind/GVK (string) to the specific model objects to be watched (ImmutableMap)
  const k8sModels = k8sModelsRef.current;

  // reduxIDs -- Map of keys from "resources" to the {id, action} for watching the specific resource
  const reduxIDs = React.useMemo<{
    [key: string]: ReturnType<GetWatchData> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const modelReference = transformGroupVersionKindToReference(
              /**
               * This throws the error: "Argument of type 'string | K8sGroupVersionKind | undefined' is not assignable to
               * parameter of type 'string | K8sGroupVersionKind'. Type 'undefined' is not assignable to type 'string | K8sGroupVersionKind'"
               * Q: Why does the similar line not throw an error on line 65, 73
               */
              resources[key].groupVersionKind || resources[key].kind,
            );

            const resourceModel =
              k8sModels.get(modelReference) ||
              k8sModels.get(getGroupVersionKindForReference(modelReference).kind);
            if (!resourceModel) {
              ids[key] = {
                noModel: true,
              };
            } else {
              const watchData = getWatchData(resources[key], resourceModel, cluster);
              if (watchData) {
                ids[key] = watchData;
              }
            }
            return ids;
          }, {})
        : {}, // Replaced null with {} to fix error - TODO - return specific type wherever possible
    [k8sModels, modelsLoaded, resources, cluster],
  );

  // The following block of lines dispatches action to watchResource (with cleanup for stopping the watch) for each resource in "resources"
  const dispatch = useDispatch();
  React.useEffect(() => {
    const reduxIDKeys = Object.keys(reduxIDs || {});
    reduxIDKeys.forEach((k) => {
      // if (reduxIDs[k].action) {    // Commented out as error indicates this line always returns true
      dispatch(reduxIDs[k].action);
      // }
    });
    return () => {
      reduxIDKeys.forEach((k) => {
        // if (reduxIDs[k].action) {  // Commented out as error indicates this line always returns true
        dispatch(k8sActions.stopK8sWatch(reduxIDs[k].id));
        // }
      });
    };
  }, [dispatch, reduxIDs]);

  /**
   * Error - lines 151-158
   * Argument of type '(oldK8s: ImmutableMap<string, K8sModelCommon>, newK8s: ImmutableMap<string, K8sModelCommon>) => boolean' is not assignable to parameter of type 'never'.
   * Q - not fully clear on how the custom memoization options using oldK8s and newK8s
   */
  const resourceK8sSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        // specifying createSelectorCreator<ImmutableMap<string, K8sKind>> throws type error
        defaultMemoize as any,
        (
          oldK8s: ImmutableMap<string, K8sModelCommon>,
          newK8s: ImmutableMap<string, K8sModelCommon>,
        ) =>
          Object.keys(reduxIDs || {})
            .filter((k) => !reduxIDs[k].noModel)
            .every((k) => oldK8s.get(reduxIDs[k].id) === newK8s.get(reduxIDs[k].id)),
      ),
    [reduxIDs],
  );

  const resourceK8sSelector = React.useMemo(
    // Q: What's the reason for useMemo here - reselect also appears to return a memoized selector
    () =>
      resourceK8sSelectorCreator(
        (state: SDKStoreState) => state.k8s, //  Replaced OpenShiftReduxRootState with SDKStoreState
        (k8s) => k8s,
      ),
    [resourceK8sSelectorCreator],
  );

  const resourceK8s = useSelector(resourceK8sSelector);

  const results = React.useMemo(
    () =>
      Object.keys(resources).reduce((acc, key) => {
        if (reduxIDs?.[key].noModel) {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          };
        } else if (resourceK8s.has(reduxIDs?.[key].id)) {
          // lines 187-189 - Error on resourceK8s "Object is possibly 'undefined'."
          const data = getReduxData(resourceK8s.getIn([reduxIDs[key].id, 'data']), resources[key]);
          const loaded = resourceK8s.getIn([reduxIDs[key].id, 'loaded']);
          const loadError = resourceK8s.getIn([reduxIDs[key].id, 'loadError']);
          acc[key] = { data, loaded, loadError };
        } else {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: false,
            loadError: undefined,
          };
        }
        return acc;
      }, {} as any),
    [resources, reduxIDs, resourceK8s],
  );
  return results;
};
