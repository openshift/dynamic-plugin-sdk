import { CustomError, applyDefaults } from '@monorepo/common';
import type { ResourceFetch } from '@monorepo/common';

class FetchError extends CustomError {
  constructor(message: string, readonly status: number, readonly response: Response) {
    super(message);
  }
}

/**
 * Basic implementation of {@link ResourceFetch} that uses the {@link fetch} API.
 */
export const basicFetch: ResourceFetch = async (url, options = {}) => {
  const response = await fetch(url, applyDefaults(options, { method: 'GET' }));

  if (!response.ok) {
    throw new FetchError(response.statusText, response.status, response);
  }

  return response;
};
