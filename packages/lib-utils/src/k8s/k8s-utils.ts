import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';
import type {
  K8sModelCommon,
  K8sResourceCommon,
  QueryOptions,
  QueryParams,
  Selector,
  MatchExpression,
  MatchLabels,
  K8sResourceKindReference,
  GetGroupVersionKindForModel,
  K8sGroupVersionKind,
} from '../types/k8s';
import type { WebSocketOptions } from '../web-socket/types';
import { WebSocketFactory } from '../web-socket/WebSocketFactory';

const getQueryString = (queryParams: QueryParams) =>
  Object.entries(queryParams)
    .map(([key, value = '']) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModelCommon) => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  return isLegacy ? `/api/${apiVersion}` : `/apis/${apiGroup}/${apiVersion}`;
};

/**
 * Builds a k8s resource URL to the provided model, augmented with the resource or query metadata.
 * @param model - the model of the resource you want to connect to
 * @param resource - inspected if you provide it for metadata attributes
 * @param queryOptions - additional and alternative configuration for the URL
 * @param queryOptions.ns - namespace, if omitted resource.metadata.namespace
 * @param queryOptions.name - name, if omitted resource.metadata.name
 * @param queryOptions.path - additional path you want on the end
 * @param queryOptions.queryParams - any additional query params you way want
 */
export const getK8sResourceURL = (
  model: K8sModelCommon,
  resource?: K8sResourceCommon,
  queryOptions: QueryOptions = {},
) => {
  const { ns, name, path, queryParams } = queryOptions;
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

  return resourcePath;
};

const requirementToString = (requirement: MatchExpression): string => {
  if (requirement.operator === 'Equals') {
    return `${requirement.key}=${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'NotEquals') {
    return `${requirement.key}!=${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'Exists') {
    return requirement.key;
  }

  if (requirement.operator === 'DoesNotExist') {
    return `!${requirement.key}`;
  }

  if (requirement.operator === 'In') {
    return `${requirement.key} in (${_.toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'NotIn') {
    return `${requirement.key} notin (${_.toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'GreaterThan') {
    return `${requirement.key} > ${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'LessThan') {
    return `${requirement.key} < ${requirement.values?.[0]}`;
  }

  return '';
};

const createEquals = (key: string, value: string): MatchExpression => ({
  key,
  operator: 'Equals',
  values: [value],
});

const isOldFormat = (selector: Selector | MatchLabels) =>
  !selector.matchLabels && !selector.matchExpressions;

const toRequirements = (selector: Selector = {}): MatchExpression[] => {
  const requirements: MatchExpression[] = [];
  const matchLabels = isOldFormat(selector) ? selector : selector.matchLabels;
  const { matchExpressions } = selector;

  Object.keys(matchLabels || {})
    .sort()
    .forEach((k) => {
      const value = matchLabels?.[k] as string;
      requirements.push(createEquals(k, value));
    });

  matchExpressions?.forEach((me) => {
    requirements.push(me);
  });

  return requirements;
};

export const selectorToString = (selector: Selector): string => {
  const requirements = toRequirements(selector);
  return requirements.map(requirementToString).join(',');
};

export const k8sWatch = (
  kind: K8sModelCommon,
  query: {
    labelSelector?: Selector;
    resourceVersion?: string;
    ns?: string;
    fieldSelector?: string;
  } = {},
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
) => {
  const queryParams: QueryParams = { watch: 'true' };
  const opts: {
    queryParams: QueryParams;
    ns?: string;
  } = { queryParams };
  const wsOptionsUpdated: WebSocketOptions = {
    path: '',
    reconnect: true,
    jsonParse: true,
    bufferFlushInterval: 500,
    bufferMax: 1000,
    ...options,
  };

  const { labelSelector } = query;
  if (labelSelector) {
    const encodedSelector = selectorToString(labelSelector);
    if (encodedSelector) {
      queryParams.labelSelector = encodedSelector;
    }
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = query.fieldSelector;
  }

  if (query.ns) {
    opts.ns = query.ns;
  }

  if (query.resourceVersion) {
    queryParams.resourceVersion = query.resourceVersion;
  }

  const path = getK8sResourceURL(kind, undefined, opts);
  wsOptionsUpdated.path = path;

  return new WebSocketFactory(path, wsOptionsUpdated as WebSocketOptions);
};

/**
 * Provides a group, version, and kind for a k8s model.
 * @param model k8s model
 * @returns The group, version, kind for the provided model.
 * If the model does not have an apiGroup, group "core" will be returned.
 * */
export const getGroupVersionKindForModel: GetGroupVersionKindForModel = ({
  apiGroup,
  apiVersion,
  kind,
}) => ({
  ...(apiGroup && { group: apiGroup }),
  apiVersion,
  kind,
});

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind Pass K8sGroupVersionKind which will have group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind.group Pass group of k8s resource or model.
 * @param K8sGroupVersionKind.version Pass version of k8s resource or model.
 * @param K8sGroupVersionKind.kind Pass kind of k8s resource or model.
 * @return The reference for any k8s resource i.e `group~version~kind`.
 * If the group will not be present then "core" will be returned as part of the group in reference.
 * * */
export const getReference = ({
  group,
  version,
  kind,
}: K8sGroupVersionKind): K8sResourceKindReference => [group || 'core', version, kind].join('~');

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * @see getGroupVersionKindForModel
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s model.
 * @param model k8s model
 * @return The reference for model i.e `group~version~kind`.
 * * */
export const getReferenceForModel = (model: K8sModelCommon): K8sResourceKindReference =>
  getReference({ group: model.apiGroup, version: model.apiVersion, kind: model.kind });

// TODO Migrate implementation or refactor K8s reducer to avoid usage
let k8sModels: ImmutableMap<K8sResourceKindReference, K8sModelCommon>;

export const allModels = () => {
  if (!k8sModels) {
    k8sModels = ImmutableMap<K8sResourceKindReference, K8sModelCommon>();
  }
  return k8sModels;
};

let namespacedResources: Set<string>;

export const getNamespacedResources = () => {
  if (!namespacedResources) {
    namespacedResources = new Set();
  }
  return namespacedResources;
};

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a group, version, and kind for a reference.
 * @param reference reference for group, version, kind i.e `group~version~kind`.
 * @returns The group, version, kind for the provided reference.
 * If the group's value is "core" it denotes resource does not have an API group.
 * */
export const getGroupVersionKindForReference = (
  reference: K8sResourceKindReference,
): K8sGroupVersionKind => {
  const referenceSplit = reference.split('~');
  if (referenceSplit.length > 3) {
    throw new Error('Provided reference is invalid.');
  }

  const [group, version, kind] = referenceSplit;
  return {
    group,
    version,
    kind,
  };
};

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a reference string that uniquely identifies the group, version, and kind of K8sGroupVersionKind.
 * @param kind kind can be of type K8sResourceKindReference or K8sGroupVersionKind
 * @return The reference i.e `group~version~kind`.
 * * */
export const transformGroupVersionKindToReference = (
  kind: K8sResourceKindReference | K8sGroupVersionKind,
): K8sResourceKindReference =>
  kind && typeof kind !== 'string' ? getReference(kind) : (kind as K8sResourceKindReference);
