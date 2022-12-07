/**
 * Fetch a resource over HTTP and return the {@link Response} object.
 */
export type ResourceFetch = (
  url: string,
  requestInit?: RequestInit,
  isK8sAPIRequest?: boolean,
) => Promise<Response>;
