import { CustomError, applyDefaults, applyOverrides } from '@monorepo/common';
import { getUtilsConfig } from '../config';

export type FetchOptionArgs = [requestOptions?: RequestInit, timeout?: number];

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
  ...[url, requestOptions = {}, timeout = defaultTimeout]: ResourceReadArgs
): Promise<Response> => {
  const fetchPromise = getUtilsConfig().appFetch(
    url,
    applyDefaults(requestOptions, { method: 'GET' }),
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
  ...[url, requestOptions = {}, timeout = defaultTimeout]: ResourceReadArgs
): Promise<string> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestOptions, { headers: { Accept: 'text/plain' } }),
    timeout,
  );

  const responseText = await response.text();

  return responseText ?? '';
};

export const commonFetchJSON = async <TResult>(
  ...[url, requestOptions = {}, timeout = defaultTimeout]: ResourceReadArgs
): Promise<TResult> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestOptions, { headers: { Accept: 'application/json' } }),
    timeout,
  );

  const responseText = await response.text();

  return response.ok ? JSON.parse(responseText) : null;
};

const commonFetchJSONWithBody = <TResult>(
  url: string,
  data: unknown,
  requestOptions: RequestInit,
  timeout?: number,
) => {
  const options = applyOverrides(requestOptions, {
    headers: {
      'Content-Type': `application/${
        requestOptions.method === 'PATCH' ? 'json-patch+json' : 'json'
      };charset=UTF-8`,
    },
    body: JSON.stringify(data),
  });

  return commonFetchJSON<TResult>(url, options, timeout);
};

commonFetchJSON.put = async <TResult>(
  ...[url, data, requestOptions = {}, timeout = defaultTimeout]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(url, data, applyOverrides(requestOptions, { method: 'PUT' }), timeout);

commonFetchJSON.post = async <TResult>(
  ...[url, data, requestOptions = {}, timeout = defaultTimeout]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(url, data, applyOverrides(requestOptions, { method: 'POST' }), timeout);

commonFetchJSON.patch = async <TResult>(
  ...[url, data, requestOptions = {}, timeout = defaultTimeout]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(url, data, applyOverrides(requestOptions, { method: 'PATCH' }), timeout);

commonFetchJSON.delete = async <TResult>(
  ...[url, data, requestOptions = {}, timeout = defaultTimeout]: ResourceDeleteArgs
): Promise<TResult> => {
  const options = applyOverrides(requestOptions, { method: 'DELETE' });
  return data
    ? commonFetchJSONWithBody(url, data, options, timeout)
    : commonFetchJSON(url, options, timeout);
};
