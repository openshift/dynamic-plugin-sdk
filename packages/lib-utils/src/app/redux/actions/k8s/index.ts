import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { ActionType as Action } from 'typesafe-actions';
import { action } from 'typesafe-actions';
import { k8sListResource, k8sGetResource } from '../../../../k8s/k8s-resource';
import { k8sWatch } from '../../../../k8s/k8s-utils';
import type { DiscoveryResources } from '../../../../types/api-discovery';
import type { K8sModelCommon, K8sResourceCommon, FilterValue } from '../../../../types/k8s';
import { getImpersonate, getActiveCluster } from '../../reducers/core';

export enum ActionType {
  ReceivedResources = 'resources',
  GetResourcesInFlight = 'getResourcesInFlight',
  StartWatchK8sObject = 'startWatchK8sObject',
  StartWatchK8sList = 'startWatchK8sList',
  ModifyObject = 'modifyObject',
  StopWatchK8s = 'stopWatchK8s',

  Errored = 'errored',
  Loaded = 'loaded',
  BulkAddToList = 'bulkAddToList',
  UpdateListFromWS = 'updateListFromWS',
  FilterList = 'filterList',
}

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceCommon };

export const updateListFromWS = (id: string, k8sObjects: K8sEvent[]) =>
  action(ActionType.UpdateListFromWS, { id, k8sObjects });
export const loaded = (id: string, k8sObjects: K8sResourceCommon | K8sResourceCommon[]) =>
  action(ActionType.Loaded, { id, k8sObjects });

export const bulkAddToList = (id: string, k8sObjects: K8sResourceCommon[]) =>
  action(ActionType.BulkAddToList, { id, k8sObjects });

export const startWatchK8sObject = (id: string) => action(ActionType.StartWatchK8sObject, { id });
export const startWatchK8sList = (id: string, query: { [key: string]: string }) =>
  action(ActionType.StartWatchK8sList, { id, query });
export const modifyObject = (id: string, k8sObjects: K8sResourceCommon) =>
  action(ActionType.ModifyObject, { id, k8sObjects });
export const stopWatchK8s = (id: string) => action(ActionType.StopWatchK8s, { id });

export const errored = (id: string, k8sObjects: unknown) =>
  action(ActionType.Errored, { id, k8sObjects });
export const filterList = (id: string, name: string, value: FilterValue) =>
  action(ActionType.FilterList, { id, name, value });

export const partialObjectMetadataListHeader = {
  Accept: 'application/json;as=PartialObjectMetadataList;v=v1;g=meta.k8s.io,application/json',
};

export const partialObjectMetadataHeader = {
  Accept: 'application/json;as=PartialObjectMetadata;v=v1;g=meta.k8s.io,application/json',
};

// TODO remove prolific use of any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WS = {} as { [id: string]: WebSocket & any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POLLs: any = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REF_COUNTS: any = {};

const paginationLimit = 250;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stopK8sWatch = (id: string) => (dispatch: any) => {
  REF_COUNTS[id] -= 1;
  if (REF_COUNTS[id] > 0) {
    return _.noop;
  }

  const ws = WS[id];
  if (ws) {
    ws.destroy();
    delete WS[id];
  }
  const poller = POLLs[id];
  clearInterval(poller);
  delete POLLs[id];
  delete REF_COUNTS[id];
  return dispatch(stopWatchK8s(id));
};

export const watchK8sList =
  (
    id: string,
    query: { [key: string]: string },
    k8skind: K8sModelCommon,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraAction?: any,
    partialMetadata = false,
  ) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: any, getState: any) => {
    // Only one watch per unique list ID
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return _.noop;
    }

    const queryWithCluster = query;
    if (!queryWithCluster.cluster) {
      queryWithCluster.cluster = getActiveCluster(getState());
    }
    dispatch(startWatchK8sList(id, queryWithCluster));
    REF_COUNTS[id] = 1;

    const incrementallyLoad = async (continueToken = ''): Promise<string | undefined> => {
      // the list may not still be around...
      if (!REF_COUNTS[id]) {
        // let .then handle the cleanup
        return undefined;
      }

      const requestOptions: RequestInit = partialMetadata
        ? {
            headers: partialObjectMetadataListHeader,
          }
        : {};

      const response = await k8sListResource({
        model: k8skind,
        queryOptions: {
          queryParams: {
            limit: paginationLimit,
            ...queryWithCluster,
            ...(continueToken ? { continue: continueToken } : {}),
          },
        },
        fetchOptions: {
          requestInit: requestOptions,
        },
      });

      if (!REF_COUNTS[id]) {
        return undefined;
      }

      if (!continueToken) {
        [loaded, extraAction].forEach((f) => f && dispatch(f(id, response.items)));
      } else {
        dispatch(bulkAddToList(id, response.items));
      }

      if (response.metadata.continue) {
        return incrementallyLoad(response.metadata.continue);
      }
      return response.metadata.resourceVersion;
    };
    /**
     * Incrementally fetch list (XHR) using k8s pagination then use its resourceVersion to
     *  start listening on a WS (?resourceVersion=$resourceVersion)
     *  start the process over when:
     *   1. the WS closes abnormally
     *   2. the WS can not establish a connection within $TIMEOUT
     */
    const pollAndWatch = async () => {
      delete POLLs[id];

      try {
        const resourceVersion = await incrementallyLoad();
        // ensure this watch should still exist because pollAndWatch is recursiveish
        if (!REF_COUNTS[id]) {
          consoleLogger.info(`stopped watching ${id} before finishing incremental loading.`);
          // call cleanup function out of abundance of caution...
          dispatch(stopK8sWatch(id));
          return;
        }

        if (WS[id]) {
          consoleLogger.warn(`Attempted to create multiple websockets for ${id}.`);
          return;
        }

        if (!_.get(k8skind, 'verbs', ['watch']).includes('watch')) {
          consoleLogger.warn(
            'Resource does not support watching, falling back to polling.',
            k8skind,
          );
          if (!POLLs[id]) {
            POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
          }
          return;
        }

        const { subprotocols } = getImpersonate(getState()) || {};
        WS[id] = k8sWatch(
          k8skind,
          { ...queryWithCluster, resourceVersion },
          { subprotocols, timeout: 60 * 1000 },
        );
      } catch (e) {
        if (!REF_COUNTS[id]) {
          consoleLogger.error(
            `stopped watching ${id} before finishing incremental loading with error ${e}!`,
          );
          // call cleanup function out of abundance of caution...
          dispatch(stopK8sWatch(id));
          return;
        }

        dispatch(errored(id, e));

        if (!POLLs[id]) {
          POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
        }
        return;
      }

      WS[id]
        .onclose((event: { code: number }) => {
          // Close Frame Status Codes: https://tools.ietf.org/html/rfc6455#section-7.4.1
          if (event.code !== 1006) {
            return;
          }
          consoleLogger.info('WS closed abnormally - starting polling loop over!');
          const ws = WS[id];
          ws?.destroy();
        })
        .ondestroy((timedOut: boolean) => {
          if (!timedOut) {
            return;
          }
          // If the WS is unsucessful for timeout duration, assume it is less work
          //  to update the entire list and then start the WS again

          consoleLogger.info(`${id} timed out - restarting polling`);
          delete WS[id];

          if (POLLs[id]) {
            return;
          }

          POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .onbulkmessage((events: any) =>
          [updateListFromWS, extraAction].forEach((f) => f && dispatch(f(id, events))),
        );
    };
    return pollAndWatch();
  };

export const watchK8sObject =
  (
    id: string,
    name: string,
    namespace: string,
    query: { [key: string]: string },
    k8sType: K8sModelCommon,
    partialMetadata = false,
  ) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: any, getState: any) => {
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return _.noop;
    }
    const watch = dispatch(startWatchK8sObject(id));
    REF_COUNTS[id] = 1;

    const queryWithCluster = query;
    if (!queryWithCluster.cluster) {
      queryWithCluster.cluster = getActiveCluster(getState());
    }

    if (queryWithCluster.name) {
      queryWithCluster.fieldSelector = `metadata.name=${queryWithCluster.name}`;
      delete queryWithCluster.name;
    }

    const requestOptions: RequestInit = partialMetadata
      ? {
          headers: partialObjectMetadataHeader,
        }
      : {};

    const poller = () => {
      k8sGetResource({
        model: k8sType,
        queryOptions: {
          name,
          ns: namespace,
          queryParams: { cluster: queryWithCluster.cluster },
        },
        fetchOptions: {
          requestInit: requestOptions,
        },
      })
        .then(
          (o: K8sResourceCommon) => dispatch(modifyObject(id, o)),
          (e: unknown) => dispatch(errored(id, e)),
        )
        .catch((err: Error) => {
          consoleLogger.error(err);
        });
    };
    POLLs[id] = setInterval(poller, 30 * 1000);
    poller();

    if (!_.get(k8sType, 'verbs', ['watch']).includes('watch')) {
      consoleLogger.warn('Resource does not support watching', k8sType);
      return _.noop;
    }

    const { subprotocols } = getImpersonate(getState()) || {};

    // TODO use websocket handler
    WS[id] = k8sWatch(k8sType, queryWithCluster, { subprotocols });
    // WS[id] = k8sWatch(k8sType, queryWithCluster, { subprotocols }).onbulkmessage((events: { object: K8sResourceCommon }[]) =>
    //     events.forEach((e: { object: K8sResourceCommon }) => dispatch(modifyObject(id, e.object))),
    // );
    return watch;
  };

export const receivedResources = (resources: DiscoveryResources) =>
  action(ActionType.ReceivedResources, { resources });
export const getResourcesInFlight = () => action(ActionType.GetResourcesInFlight);

const k8sActions = {
  startWatchK8sObject,
  startWatchK8sList,
  modifyObject,
  stopWatchK8s,
  errored,
  loaded,
  bulkAddToList,
  updateListFromWS,
  filterList,
  receivedResources,
  getResourcesInFlight,
};

export type K8sAction = Action<typeof k8sActions>;
