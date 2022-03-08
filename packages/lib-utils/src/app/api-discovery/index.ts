import type { AnyObject } from '@monorepo/common';
import { consoleLogger } from '@monorepo/common';
import * as _ from 'lodash-es';
import { plural } from 'pluralize';
import type { Dispatch } from 'redux';
import { kindToAbbr } from '../../k8s/k8s-resource';
import type {
  APIResourceList,
  DiscoveryResources,
  InitAPIDiscovery,
} from '../../types/api-discovery';
import type { K8sModelCommon } from '../../types/k8s';
import type { DispatchWithThunk } from '../../types/redux';
import { commonFetchJSON } from '../../utils/common-fetch';
import { getResourcesInFlight, receivedResources } from '../redux/actions/k8s';
import { cacheResources, getCachedResources } from './discovery-cache';

const POLLs: { [id: string]: number } = {};
const apiDiscovery = 'apiDiscovery';
const API_DISCOVERY_POLL_INTERVAL = 60_000;

const pluralizeKind = (kind: string): string => {
  // Use startCase to separate words so the last can be pluralized but remove spaces so as not to humanize
  const pluralized = plural(_.startCase(kind)).replace(/\s+/g, '');
  // Handle special cases like DB -> DBs (instead of DBS).
  if (pluralized === `${kind}S`) {
    return `${kind}s`;
  }
  return pluralized;
};

const defineModels = (list: APIResourceList): K8sModelCommon[] => {
  const { apiGroup, apiVersion } = list;
  if (!list.resources || list.resources.length < 1) {
    return [];
  }
  return list.resources
    .filter(({ name }) => !name.includes('/'))
    .map(
      ({ name, singularName, namespaced, kind, verbs, shortNames }) =>
        <K8sModelCommon>{
          ...(apiGroup ? { apiGroup } : {}),
          apiVersion,
          kind,
          namespaced,
          verbs,
          shortNames,
          plural: name,
          crd: true,
          abbr: kindToAbbr(kind),
          labelPlural: pluralizeKind(kind),
          path: name,
          id: singularName,
          label: kind,
        },
    );
};

type APIResourceData = {
  groups: {
    name: string;
    versions: {
      groupVersion: unknown;
    }[];
    preferredVersion: { version: unknown };
  }[];
};

const getResources = async (): Promise<DiscoveryResources> => {
  const apiResourceData: APIResourceData = await commonFetchJSON('/apis');
  const groupVersionMap = apiResourceData.groups.reduce(
    (acc: AnyObject, { name, versions, preferredVersion: { version } }) => {
      acc[name] = {
        versions: _.map(versions, 'version'),
        preferredVersion: version,
      };
      return acc;
    },
    {},
  );
  const all: Promise<APIResourceList>[] = _.flatten(
    apiResourceData.groups.map((group) =>
      group.versions.map((version) => `/apis/${version.groupVersion}`),
    ),
  )
    .concat(['/api/v1'])
    .map((p) => commonFetchJSON<K8sModelCommon>(`api/kubernetes${p}`).catch((err) => err));

  return Promise.all(all).then((data) => {
    const resourceSet = new Set<string>();
    const namespacedSet = new Set<string>();
    data.forEach(
      (d) =>
        d.resources &&
        d.resources.forEach(({ namespaced, name }) => {
          resourceSet.add(name);
          if (namespaced) {
            namespacedSet.add(name);
          }
        }),
    );
    const allResources = [...resourceSet].sort();

    const safeResources: string[] = [];
    const adminResources: string[] = [];
    const models = _.flatten(data.filter((d) => d.resources).map(defineModels));
    const coreResources = new Set([
      'roles',
      'rolebindings',
      'clusterroles',
      'clusterrolebindings',
      'thirdpartyresources',
      'nodes',
      'secrets',
    ]);
    allResources.forEach((r) =>
      coreResources.has(r.split('/')[0]) ? adminResources.push(r) : safeResources.push(r),
    );
    const configResources = _.filter(
      models,
      (m) => m.apiGroup === 'config.openshift.io' && m.kind !== 'ClusterOperator',
    );
    const clusterOperatorConfigResources = _.filter(
      models,
      (m) => m.apiGroup === 'operator.openshift.io',
    );

    return {
      allResources,
      safeResources,
      adminResources,
      configResources,
      clusterOperatorConfigResources,
      namespacedSet,
      models,
      groupVersionMap,
    } as DiscoveryResources;
  });
};

const updateResources = () => (dispatch: Dispatch) => {
  dispatch(getResourcesInFlight());

  getResources()
    .then((resources) => {
      // Cache the resources whenever discovery completes to improve console load times.
      cacheResources(resources);
      dispatch(receivedResources(resources));
      return resources;
    })
    .catch((err) => consoleLogger.error('Fetching resource failed:', err));
};

const startAPIDiscovery = () => (dispatch: DispatchWithThunk) => {
  consoleLogger.info('API discovery method: Polling');
  // Poll API discovery every 30 seconds since we can't watch CRDs
  dispatch(updateResources());
  if (POLLs[apiDiscovery]) {
    clearTimeout(POLLs[apiDiscovery]);
    delete POLLs[apiDiscovery];
  }
  POLLs[apiDiscovery] = window.setTimeout(
    () => dispatch(startAPIDiscovery()),
    API_DISCOVERY_POLL_INTERVAL,
  );
};

export const initAPIDiscovery: InitAPIDiscovery = (storeInstance) => {
  getCachedResources()
    .then((resources) => {
      if (resources) {
        storeInstance.dispatch(receivedResources(resources));
      }
      // Still perform discovery to refresh the cache.
      storeInstance.dispatch(startAPIDiscovery());
      return resources;
    })
    .catch(() => storeInstance.dispatch(startAPIDiscovery()));
};
