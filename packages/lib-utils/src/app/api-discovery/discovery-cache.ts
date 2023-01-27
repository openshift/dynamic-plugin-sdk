import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import { getReferenceForModel } from '../../k8s/k8s-utils';
import type { DiscoveryResources } from '../../types/api-discovery';
import type { K8sModelCommon } from '../../types/k8s';

const SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = 'sdk/api-discovery-resources';

const mergeByKey = (prev: K8sModelCommon[], next: K8sModelCommon[]) =>
  Object.values(_.merge(_.keyBy(prev, getReferenceForModel), _.keyBy(next, getReferenceForModel)));

const getLocalResources = () => {
  try {
    return JSON.parse(localStorage.getItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY) || '{}');
  } catch (e) {
    consoleLogger.error('Cannot load cached API resources', e);
    throw e;
  }
};

const setLocalResources = (resources: DiscoveryResources[]) => {
  try {
    localStorage.setItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY, JSON.stringify(resources));
  } catch (e) {
    consoleLogger.error('Error caching API resources in localStorage', e);
    throw e;
  }
};
export const cacheResources = (resources: DiscoveryResources[]) => {
  const allResources = [...[getLocalResources()], ...resources].reduce(
    (acc, curr) =>
      _.mergeWith(acc, curr, (first, second) => {
        if (Array.isArray(first) && first[0]?.constructor?.name === 'Object') {
          return mergeByKey(first, second);
        }

        return undefined;
      }),
    {},
  );
  setLocalResources(allResources);
};

export const getCachedResources = () => {
  const resourcesJSON = localStorage.getItem(SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);
  if (!resourcesJSON) {
    consoleLogger.error(
      `No API resources found in localStorage for key ${SDK_API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY}`,
    );
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
