import { CustomError, applyDefaults, applyOverrides } from '@monorepo/common';
import { getUtilsConfig } from '../config';
import type { CommonFetch, CommonFetchText, CommonFetchJSON } from '../types/fetch';

class TimeoutError extends CustomError {
  public constructor(url: string, ms: number) {
    super(`Call to ${url} timed out after ${ms}ms`);
  }
}

const defaultTimeout = 60_000; // one minute

export const commonFetch: CommonFetch = async (url, options = {}, timeout = defaultTimeout) => {
  const fetchPromise = getUtilsConfig().appFetch(url, applyDefaults(options, { method: 'GET' }));

  if (timeout <= 0) {
    return fetchPromise;
  }

  const timeoutPromise = new Promise<Response>((resolve, reject) => {
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};

export const commonFetchText: CommonFetchText = async (
  url,
  options = {},
  timeout = defaultTimeout,
) => {
  const response = await commonFetch(
    url,
    applyDefaults(options, { headers: { Accept: 'text/plain' } }),
    timeout,
  );

  const responseText = await response.text();

  return responseText ?? '';
};

export const commonFetchJSON: CommonFetchJSON = async (
  url,
  options = {},
  timeout = defaultTimeout,
) => {
  const response = await commonFetch(
    url,
    applyDefaults(options, { headers: { Accept: 'application/json' } }),
    timeout,
  );

  const responseText = await response.text();

  return response.ok ? JSON.parse(responseText) : null;
};

const commonFetchJSONWithBody = (
  url: string,
  data: unknown,
  options: RequestInit,
  timeout?: number,
) =>
  commonFetchJSON(
    url,
    applyOverrides(options, {
      headers: {
        'Content-Type': `application/${
          options.method === 'PATCH' ? 'json-patch+json' : 'json'
        };charset=UTF-8`,
      },
      body: JSON.stringify(data),
    }),
    timeout,
  );

commonFetchJSON.put = async (url, data, options = {}, timeout = defaultTimeout) =>
  commonFetchJSONWithBody(url, data, applyOverrides(options, { method: 'PUT' }), timeout);

commonFetchJSON.post = async (url, data, options = {}, timeout = defaultTimeout) =>
  commonFetchJSONWithBody(url, data, applyOverrides(options, { method: 'POST' }), timeout);

commonFetchJSON.patch = async (url, data, options = {}, timeout = defaultTimeout) =>
  commonFetchJSONWithBody(url, data, applyOverrides(options, { method: 'PATCH' }), timeout);

commonFetchJSON.delete = async (url, data, options = {}, timeout = defaultTimeout) =>
  data
    ? commonFetchJSONWithBody(url, data, applyOverrides(options, { method: 'DELETE' }), timeout)
    : commonFetchJSON(url, applyOverrides(options, { method: 'DELETE' }), timeout);
