import * as _ from 'lodash-es';
import type { K8sModelCommon, K8sResourceCommon, QueryOptions, QueryParams } from '../types/k8s';

const getQueryString = (queryParams: QueryParams) =>
  Object.entries(queryParams)
    .map(([key, value = '']) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModelCommon) => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  return isLegacy ? `/api/${apiVersion}` : `/apis/${apiGroup}/${apiVersion}`;
};

export const getK8sResourceURL = (
  model: K8sModelCommon,
  resource?: K8sResourceCommon,
  { ns, name, path, queryParams }: QueryOptions = {},
) => {
  let resourcePath = getK8sAPIPath(model);

  if (resource?.metadata?.namespace) {
    resourcePath += `/namespaces/${resource.metadata.namespace}`;
  } else if (ns) {
    resourcePath += `/namespaces/${ns}`;
  }

  if (resource?.metadata?.namespace && ns && resource.metadata.namespace !== ns) {
    throw new Error('Resource payload namespace vs. query options namespace mismatch');
  }

  resourcePath += `/${model.plural}`;

  if (resource?.metadata?.name) {
    resourcePath += `/${encodeURIComponent(resource.metadata.name)}`;
  } else if (name) {
    resourcePath += `/${encodeURIComponent(name)}`;
  }

  if (resource?.metadata?.name && name && resource.metadata.name !== name) {
    throw new Error('Resource payload name vs. query options name mismatch');
  }

  if (path) {
    resourcePath += `/${path}`;
  }

  if (queryParams && !_.isEmpty(queryParams)) {
    resourcePath += `?${getQueryString(queryParams)}`;
  }

  return `/${resourcePath}`;
};
