import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import { getReferenceForModel } from '../../k8s/k8s-utils';
import type { DiscoveryResources } from '../../types/api-discovery';
import type { K8sModelCommon } from '../../types/k8s';

const SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = 'sdk/api-discovery-resources';

const mergeByKey = (prev: K8sModelCommon[], next: K8sModelCommon[]) =>
  Object.values(_.merge(_.keyBy(prev, getReferenceForModel), _.keyBy(next, getReferenceForModel)));

export const cacheResources = (resources: DiscoveryResources[]) => {
  let allResources;
  try {
    allResources = [
      ...[JSON.parse(localStorage.getItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY) || '{}')],
      ...resources,
    ].reduce((acc, curr) => {
      const { models, configResources, clusterOperatorConfigResources, ...rest } = curr || {};
      return {
        ..._.merge(acc, rest),
        configResources: mergeByKey(acc?.configResources, configResources || []),
        models: mergeByKey(acc?.models, models || []),
        clusterOperatorConfigResources: mergeByKey(
          acc?.clusterOperatorConfigResources,
          clusterOperatorConfigResources || [],
        ),
      };
    }, {});
  } catch (e) {
    consoleLogger.error('Error caching API resources in localStorage', e);
    throw e;
  }
  try {
    localStorage.setItem(
      SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY,
      JSON.stringify(allResources),
    );
  } catch (e) {
    consoleLogger.error('Error caching API resources in localStorage', e);
    throw e;
  }
};

export const getCachedResources = () => {
  const resourcesJSON = localStorage.getItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);
  if (!resourcesJSON) {
    return null;
  }

  // Clear cached resources after load as a safeguard. If there's any errors
  // with the content that prevents the console from working, the bad data
  // will not be loaded when the user refreshes the console. The cache will
  // be refreshed when discovery completes.
  localStorage.removeItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

  const resources = JSON.parse(resourcesJSON);
  consoleLogger.info('Loaded cached API resources from localStorage');
  return resources;
};
