import type { AnyObject } from '@monorepo/common';
import type { K8sModelCommon, K8sResourceCommon, QueryOptions, Patch } from '../types/k8s';
import { commonFetchJSON } from '../utils/common-fetch';
import { getK8sResourceURL } from './k8s-utils';

type K8sResourceBaseOptions<TQueryOptions = QueryOptions> = {
  model: K8sModelCommon;
  queryOptions?: TQueryOptions;
  fetchOptions?: Partial<{
    requestInit: RequestInit & { wsPrefix?: string; pathPrefix?: string };
    timeout: number;
  }>;
};

type K8sResourceReadOptions = K8sResourceBaseOptions;

type K8sResourceUpdateOptions<TResource extends K8sResourceCommon> = K8sResourceBaseOptions & {
  resource: TResource;
};

type K8sResourcePatchOptions = K8sResourceBaseOptions & {
  patches: Patch[];
};

type K8sResourceDeleteOptions = K8sResourceBaseOptions & {
  payload?: AnyObject;
};

type K8sResourceListOptions = K8sResourceBaseOptions<Pick<QueryOptions, 'ns' | 'queryParams'>>;

type K8sResourceListResult<TResource extends K8sResourceCommon> = {
  apiVersion: string;
  items: TResource[];
  metadata: {
    resourceVersion: string;
    continue: string;
  };
};

export const k8sGetResource = <TResource extends K8sResourceCommon>({
  model,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceReadOptions): Promise<TResource> =>
  commonFetchJSON<TResource>(
    getK8sResourceURL(model, undefined, queryOptions),
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );

export const k8sCreateResource = <
  TResource extends K8sResourceCommon,
  TCreatedResource = TResource,
>({
  model,
  resource,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceUpdateOptions<TResource>): Promise<TCreatedResource> =>
  commonFetchJSON.post<TCreatedResource>(
    getK8sResourceURL(model, resource, queryOptions),
    resource,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );

export const k8sUpdateResource = <
  TResource extends K8sResourceCommon,
  TUpdatedResource extends TResource = TResource,
>({
  model,
  resource,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceUpdateOptions<TResource>): Promise<TUpdatedResource> => {
  if (!resource.metadata?.name) {
    return Promise.reject(new Error('Resource payload name not specified'));
  }

  return commonFetchJSON.put<TUpdatedResource>(
    getK8sResourceURL(model, resource, queryOptions),
    resource,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );
};

export const k8sPatchResource = <
  TResource extends K8sResourceCommon,
  TPatchedResource extends TResource = TResource,
>({
  model,
  patches,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourcePatchOptions): Promise<TPatchedResource> =>
  commonFetchJSON.patch<TPatchedResource>(
    getK8sResourceURL(model, undefined, queryOptions),
    patches,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );

export const k8sDeleteResource = <TResource extends K8sResourceCommon, TDeleteResult = TResource>({
  model,
  payload,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceDeleteOptions): Promise<TDeleteResult> => {
  const data: AnyObject = payload ?? {};

  if (!payload && model.propagationPolicy) {
    data.kind = 'DeleteOptions';
    data.apiVersion = 'v1';
    data.propagationPolicy = model.propagationPolicy;
  }

  return commonFetchJSON.delete<TDeleteResult>(
    getK8sResourceURL(model, undefined, queryOptions),
    data,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );
};

export const k8sListResource = <TResource extends K8sResourceCommon>({
  model,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceListOptions): Promise<K8sResourceListResult<TResource>> =>
  commonFetchJSON<K8sResourceListResult<TResource>>(
    getK8sResourceURL(model, undefined, {
      ns: queryOptions.ns,
      queryParams: queryOptions.queryParams,
    }),
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  ).then((result) => ({
    ...result,
    items: result.items.map((i) => ({
      ...i,
      apiVersion: result.apiVersion,
      kind: model.kind,
    })),
  }));

export const k8sListResourceItems = <TResource extends K8sResourceCommon>(
  options: K8sResourceListOptions,
): Promise<TResource[]> => k8sListResource<TResource>(options).then((result) => result.items);

const abbrBlacklist = ['ASS'];

/**
 * Provides an abbreviation string for given kind with respect to abbrBlacklist.
 * @param kind Kind for which the abbreviation is generated.
 * @return Abbreviation string for given kind.
 * TODO: Use in resource-icon component once it is being migrated to the SDK.
 * * */
export const kindToAbbr = (kind: string) => {
  const abbrKind = (kind.replace(/[^A-Z]/g, '') || kind.toUpperCase()).slice(0, 4);
  return abbrBlacklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind;
};
