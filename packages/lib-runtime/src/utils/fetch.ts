import { CustomError } from './errors';

/**
 * Fetch a resource via HTTP protocol and return the response body text.
 */
export type FetchResource = (url: string, method: string) => Promise<string>;

class HTTPError extends CustomError {
  constructor(message: string, readonly status: number, readonly response: Response) {
    super(message);
  }
}

/**
 * Basic implementation of {@link FetchResource} that uses the {@link fetch} API.
 */
export const basicFetch: FetchResource = async (url, method) => {
  const response = await fetch(url, { method });

  if (response.ok) {
    const responseText = await response.text();
    return responseText;
  }

  throw new HTTPError(response.statusText, response.status, response);
};
