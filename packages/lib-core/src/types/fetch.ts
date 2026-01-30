/**
 * An implementation of {@link fetch} that fetches a resource over HTTP
 * and returns the {@link Response} object.
 */
export type ResourceFetch = (url: string, requestInit?: RequestInit) => Promise<Response>;
