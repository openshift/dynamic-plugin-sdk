import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { isEqual } from 'lodash';
import { getReferenceForModel, getNamespacedResources, allModels } from '../../../../k8s/k8s-utils';
import type { K8sModelCommon, K8sResourceCommon } from '../../../../types/k8s';
import type { K8sState } from '../../../../types/redux';
import type { K8sAction } from '../../actions/k8s';
import { ActionType } from '../../actions/k8s';
import { getK8sDataById } from './selector';

const getQN: (obj: K8sResourceCommon) => string = (obj) => {
  const { name, namespace } = obj.metadata || {};
  return (namespace ? `(${namespace})-` : '') + name;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moreRecent = (a: any, b: any) => {
  const metaA = a.get('metadata').toJSON();
  const metaB = b.get('metadata').toJSON();
  if (metaA.uid !== metaB.uid) {
    return new Date(metaA.creationTimestamp) > new Date(metaB.creationTimestamp);
  }
  return parseInt(metaA.resourceVersion, 10) > parseInt(metaB.resourceVersion, 10);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const removeFromList = (list: ImmutableMap<string, any>, resource: K8sResourceCommon) => {
  const qualifiedName = getQN(resource);
  consoleLogger.info(`deleting ${qualifiedName}`);
  return list.delete(qualifiedName);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateList = (list: ImmutableMap<string, any>, nextJS: K8sResourceCommon) => {
  const qualifiedName = getQN(nextJS);
  const current = list.get(qualifiedName);
  const next = fromJS(nextJS);

  if (!current) {
    return list.set(qualifiedName, next);
  }

  if (!moreRecent(next, current)) {
    return list;
  }

  // TODO: (kans) only store the data for things we display ...
  //  and then only do this comparison for the same stuff!
  if (
    current
      .deleteIn(['metadata', 'resourceVersion'])
      .equals(next.deleteIn(['metadata', 'resourceVersion']))
  ) {
    // If the only thing that differs is resource version, don't fire an update.
    return list;
  }

  return list.set(qualifiedName, next);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadList = (oldList: any, resources: K8sResourceCommon[]) => {
  const existingKeys = new Set(oldList.keys());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return oldList.withMutations((list: ImmutableMap<string, any>) => {
    (resources || []).forEach((r: K8sResourceCommon) => {
      const qualifiedName = getQN(r);
      existingKeys.delete(qualifiedName);
      const next = fromJS(r);
      const current = list.get(qualifiedName);
      if (!current || moreRecent(next, current)) {
        list.set(qualifiedName, next);
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingKeys.forEach((k: any) => {
      const r = list.get(k);
      const metadata = r.get('metadata').toJSON();
      if (!metadata.deletionTimestamp) {
        consoleLogger.warn(
          `${metadata.namespace}-${metadata.name} is gone with no deletion timestamp!`,
        );
      }
      list.delete(k);
    });
  });
};

export const sdkK8sReducer = (state: K8sState, action: K8sAction): K8sState => {
  if (!state) {
    return fromJS({
      RESOURCES: {
        inFlight: false,
        models: ImmutableMap<string, K8sModelCommon>(),
      },
    });
  }

  let newList;
  switch (action.type) {
    case ActionType.SetResourcesInFlight:
      return state.setIn(['RESOURCES', 'inFlight'], action.payload.isInFlight);

    case ActionType.SetBatchesInFlight:
      return state.setIn(['RESOURCES', 'batchesInFlight'], action.payload.isInFlight);

    case ActionType.ReceivedResources:
      return (
        action.payload.resources.models
          .filter(
            (model) => !state?.getIn(['RESOURCES', 'models']).has(getReferenceForModel(model)),
          )
          .filter((model) => {
            const existingModel = state?.getIn(['RESOURCES', 'models', model.kind]);
            return (
              !existingModel || getReferenceForModel(existingModel) !== getReferenceForModel(model)
            );
          })
          .map((model) => {
            if (model.namespaced) {
              getNamespacedResources().add(getReferenceForModel(model));
            } else {
              getNamespacedResources().delete(getReferenceForModel(model));
            }
            return model;
          })
          .reduce((prevState, newModel) => {
            // FIXME: Need to use `kind` as model reference for legacy components accessing k8s primitives
            const [modelRef, model] = allModels().findEntry(
              (staticModel: K8sModelCommon | undefined) =>
                staticModel
                  ? getReferenceForModel(staticModel) === getReferenceForModel(newModel)
                  : false,
            ) || [getReferenceForModel(newModel), newModel];
            // Verbs and short names are not part of the static model definitions, so use the values found during discovery.
            return prevState.updateIn(['RESOURCES', 'models'], (models) =>
              models.set(modelRef, {
                ...model,
                verbs: newModel.verbs,
                shortNames: newModel.shortNames,
              }),
            );
          }, state)
          // TODO: Determine where these are used and implement filtering in that component instead of storing in Redux
          .setIn(['RESOURCES', 'allResources'], action.payload.resources.allResources)
          .setIn(['RESOURCES', 'safeResources'], action.payload.resources.safeResources)
          .setIn(['RESOURCES', 'adminResources'], action.payload.resources.adminResources)
          .setIn(['RESOURCES', 'configResources'], action.payload.resources.configResources)
          .setIn(
            ['RESOURCES', 'clusterOperatorConfigResources'],
            action.payload.resources.clusterOperatorConfigResources,
          )
          .setIn(['RESOURCES', 'namespacedSet'], action.payload.resources.namespacedSet)
          .setIn(['RESOURCES', 'groupToVersionMap'], action.payload.resources.groupVersionMap)
          .setIn(['RESOURCES', 'inFlight'], false)
      );

    case ActionType.StartWatchK8sObject:
      return state.set(
        action.payload.id,
        ImmutableMap({
          loadError: '',
          loaded: false,
          data: {},
        }),
      );

    case ActionType.StartWatchK8sList:
      if (getK8sDataById(state, action.payload.id)) {
        return state;
      }

      // We mergeDeep instead of overwriting state because it's possible to add filters before load/watching
      return state.mergeDeep({
        [action.payload.id]: {
          loadError: '',
          // has the data set been loaded successfully
          loaded: false,
          // Canonical data
          data: ImmutableMap(),
          // client side filters to be applied externally (ie, we keep all data intact)
          filters: ImmutableMap(),
          // The name of an element in the list that has been "selected"
          selected: null,
        },
      });

    case ActionType.ModifyObject: {
      const { k8sObjects, id } = action.payload;
      let currentJS = getK8sDataById(state, id) || {};
      // getIn can return JS object or Immutable object
      if (currentJS.toJSON) {
        currentJS = currentJS.toJSON();
        currentJS.metadata.resourceVersion = k8sObjects?.metadata?.resourceVersion;
        if (isEqual(currentJS, k8sObjects)) {
          // If the only thing that differs is resource version, don't fire an update.
          return state;
        }
      }
      return state.mergeIn([id], {
        loadError: '',
        loaded: true,
        data: k8sObjects,
      });
    }

    case ActionType.ClearError: {
      const { k8sObjects, id } = action.payload;
      return state.mergeIn([id], {
        loadError: '',
        loaded: true,
        data: k8sObjects,
      });
    }

    case ActionType.StopWatchK8s:
      return state.delete(action.payload.id);

    case ActionType.Errored:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      /* Don't overwrite data or loaded state if there was an error. Better to
       * keep stale data around than to suddenly have it disappear on a user.
       */
      return state.setIn([action.payload.id, 'loadError'], action.payload.k8sObjects);

    case ActionType.Loaded:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      consoleLogger.info(`loaded ${action.payload.id}`);
      // eslint-disable-next-line no-param-reassign
      state = state.mergeDeep({
        [action.payload.id]: { loaded: true, loadError: '' },
      });
      newList = loadList(getK8sDataById(state, action.payload.id), action.payload.k8sObjects);
      break;

    case ActionType.UpdateListFromWS:
      newList = getK8sDataById(state, action.payload.id);
      // k8sObjects is an array of k8s WS Events
      // eslint-disable-next-line no-restricted-syntax
      for (const { type, object } of action.payload.k8sObjects) {
        switch (type) {
          case 'DELETED':
            newList = removeFromList(newList, object);
            break;
          case 'ADDED':
          case 'MODIFIED':
            newList = updateList(newList, object);
            break;
          default:
            // possible `ERROR` type or other
            consoleLogger.warn(`unknown websocket action: ${type}`);
        }
      }
      break;

    case ActionType.BulkAddToList:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      newList = getK8sDataById(state, action.payload.id);
      newList = newList.merge(
        action.payload.k8sObjects.reduce(
          (map, obj) => map.set(getQN(obj), fromJS(obj)),
          ImmutableMap(),
        ),
      );
      break;
    case ActionType.FilterList:
      return state.setIn([action.payload.id, 'filters', action.payload.name], action.payload.value);
    default:
      return state;
  }
  return state.setIn([action.payload.id, 'data'], newList);
};
