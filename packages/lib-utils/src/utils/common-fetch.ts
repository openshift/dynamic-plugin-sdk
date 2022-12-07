import { CustomError, applyDefaults, applyOverrides } from '@openshift/dynamic-plugin-sdk';
import { getUtilsConfig } from '../config';

export type FetchOptionArgs = [
  requestInit?: RequestInit,
  timeout?: number,
  isK8sAPIRequest?: boolean,
];

type ResourceReadArgs = [url: string, ...args: FetchOptionArgs];

type ResourceUpdateArgs = [url: string, data: unknown, ...args: FetchOptionArgs];

type ResourceDeleteArgs = [url: string, data?: unknown, ...args: FetchOptionArgs];

class TimeoutError extends CustomError {
  public constructor(url: string, ms: number) {
    super(`Call to ${url} timed out after ${ms}ms`);
  }
}

const defaultTimeout = 60_000;

export const commonFetch = async (
  ...[url, requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: ResourceReadArgs
): Promise<Response> => {
  const fetchPromise = getUtilsConfig().appFetch(
    url,
    applyDefaults(requestInit, { method: 'GET' }),
    isK8sAPIRequest,
  );

  if (timeout <= 0) {
    return fetchPromise;
  }

  const timeoutPromise = new Promise<Response>((resolve, reject) => {
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};

export const commonFetchText = async (
  ...[url, requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: ResourceReadArgs
): Promise<string> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestInit, { headers: { Accept: 'text/plain' } }),
    timeout,
    isK8sAPIRequest,
  );

  const responseText = await response.text();

  return responseText ?? '';
};

export const commonFetchJSON = async <TResult>(
  ...[url, requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: ResourceReadArgs
): Promise<TResult> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestInit, { headers: { Accept: 'application/json' } }),
    timeout,
    isK8sAPIRequest,
  );

  const responseText = await response.text();

  return response.ok ? JSON.parse(responseText) : null;
};

const commonFetchJSONWithBody = <TResult>(
  url: string,
  data: unknown,
  ...[requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: FetchOptionArgs
) =>
  commonFetchJSON<TResult>(
    url,
    applyOverrides(requestInit, {
      headers: {
        'Content-Type': `application/${
          requestInit.method === 'PATCH' ? 'json-patch+json' : 'json'
        };charset=UTF-8`,
      },
      body: JSON.stringify(data),
    }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.put = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'PUT' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.post = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'POST' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.patch = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'PATCH' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.delete = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceDeleteArgs
): Promise<TResult> => {
  const requestInitOverride = applyOverrides(requestInit, { method: 'DELETE' });

  return data
    ? commonFetchJSONWithBody(url, data, requestInitOverride, timeout, isK8sAPIRequest)
    : commonFetchJSON(url, requestInitOverride, timeout, isK8sAPIRequest);
};
