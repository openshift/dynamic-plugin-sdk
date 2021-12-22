import type { AnyObject } from '@monorepo/common';

type FetchOptionArgs = [options?: RequestInit, timeout?: number];

type ResourceReadArgs = [url: string, ...args: FetchOptionArgs];

type ResourceUpdateArgs = [url: string, data: unknown, ...args: FetchOptionArgs];

type ResourceDeleteArgs = [url: string, data?: unknown, ...args: FetchOptionArgs];

export type CommonFetch = (...args: ResourceReadArgs) => Promise<Response>;

export type CommonFetchText = (...args: ResourceReadArgs) => Promise<string>;

export type CommonFetchJSON<TResult extends AnyObject = AnyObject> = {
  (...args: ResourceReadArgs): Promise<TResult>;
  put(...args: ResourceUpdateArgs): Promise<TResult>;
  post(...args: ResourceUpdateArgs): Promise<TResult>;
  patch(...args: ResourceUpdateArgs): Promise<TResult>;
  delete(...args: ResourceDeleteArgs): Promise<TResult>;
};
