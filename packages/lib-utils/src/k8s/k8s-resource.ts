import type { AnyObject } from '@monorepo/common';
import type { K8sModelCommon, K8sResourceCommon, QueryOptions, Patch } from '../types/k8s';
import type { FetchOptionArgs } from '../utils/common-fetch';
import { commonFetchJSON } from '../utils/common-fetch';
import { getK8sResourceURL } from './k8s-utils';

type K8sResourceReadArgs = [
  model: K8sModelCommon,
  options?: QueryOptions,
  ...fetchOptions: FetchOptionArgs
];

type K8sResourceUpdateArgs<TResource extends K8sResourceCommon> = [
  model: K8sModelCommon,
  resource: TResource,
  options?: QueryOptions,
  ...fetchOptions: FetchOptionArgs
];

type K8sResourcePatchArgs = [
  model: K8sModelCommon,
  patches: Patch[],
  options?: QueryOptions,
  ...fetchOptions: FetchOptionArgs
];

type K8sResourceDeleteArgs = [
  model: K8sModelCommon,
  payload?: AnyObject,
  options?: QueryOptions,
  ...fetchOptions: FetchOptionArgs
];

type K8sResourceListArgs = [
  model: K8sModelCommon,
  options?: Omit<QueryOptions, 'path'>,
  ...fetchOptions: FetchOptionArgs
];

type K8sResourceListResult<TResource extends K8sResourceCommon> = {
  apiVersion: string;
  items: TResource[];
  metadata: {
    resourceVersion: string;
  };
};

export const k8sGet = <TResource extends K8sResourceCommon>(
  ...[model, options = {}, ...fetchOptions]: K8sResourceReadArgs
): Promise<TResource> =>
  commonFetchJSON<TResource>(getK8sResourceURL(model, undefined, options), ...fetchOptions);

export const k8sCreate = <TResource extends K8sResourceCommon, TCreatedResource = TResource>(
  ...[model, resource, options = {}, ...fetchOptions]: K8sResourceUpdateArgs<TResource>
): Promise<TCreatedResource> =>
  commonFetchJSON.post<TCreatedResource>(
    getK8sResourceURL(model, resource, options),
    resource,
    ...fetchOptions,
  );

export const k8sUpdate = <
  TResource extends K8sResourceCommon,
  TUpdatedResource extends TResource = TResource,
>(
  ...[model, resource, options = {}, ...fetchOptions]: K8sResourceUpdateArgs<TResource>
): Promise<TUpdatedResource> => {
  if (!resource.metadata?.name) {
    return Promise.reject(new Error('Resource payload name not specified'));
  }

  return commonFetchJSON.put<TUpdatedResource>(
    getK8sResourceURL(model, resource, options),
    resource,
    ...fetchOptions,
  );
};

export const k8sPatch = <
  TResource extends K8sResourceCommon,
  TPatchedResource extends TResource = TResource,
>(
  ...[model, patches, options = {}, ...fetchOptions]: K8sResourcePatchArgs
): Promise<TPatchedResource> =>
  commonFetchJSON.patch<TPatchedResource>(
    getK8sResourceURL(model, undefined, options),
    patches,
    ...fetchOptions,
  );

export const k8sDelete = <TResource extends K8sResourceCommon, TDeleteResult = TResource>(
  ...[model, payload, options = {}, ...fetchOptions]: K8sResourceDeleteArgs
): Promise<TDeleteResult> => {
  const data: AnyObject = payload ?? {};

  if (!payload && model.propagationPolicy) {
    data.kind = 'DeleteOptions';
    data.apiVersion = 'v1';
    data.propagationPolicy = model.propagationPolicy;
  }

  return commonFetchJSON.delete<TDeleteResult>(
    getK8sResourceURL(model, undefined, options),
    data,
    ...fetchOptions,
  );
};

export const k8sList = <TResource extends K8sResourceCommon>(
  ...[model, options = {}, ...fetchOptions]: K8sResourceListArgs
): Promise<K8sResourceListResult<TResource>> =>
  commonFetchJSON<K8sResourceListResult<TResource>>(
    getK8sResourceURL(model, undefined, { ns: options.ns, queryParams: options.queryParams }),
    ...fetchOptions,
  ).then((result) => ({
    ...result,
    items: result.items.map((i) => ({
      ...i,
      apiVersion: result.apiVersion,
      kind: model.kind,
    })),
  }));

export const k8sListItems = <TResource extends K8sResourceCommon>(
  ...args: K8sResourceListArgs
): Promise<TResource[]> => k8sList<TResource>(...args).then((result) => result.items);
