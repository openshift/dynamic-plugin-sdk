/**
 * Fetch a resource over HTTP and return the {@link Response} object.
 */
export type ResourceFetch = (url: string, options?: RequestInit) => Promise<Response>;
