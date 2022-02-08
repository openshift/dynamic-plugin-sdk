import type { ResourceFetch } from '@monorepo/common';

export type UtilsConfig = {
  /**
   * Resource fetch implementation provided by the host application.
   *
   * Applications must validate the response before resolving the Promise.
   *
   * If the request cannot be completed successfully, the Promise should be rejected
   * with an appropriate error.
   */
  appFetch: ResourceFetch;

  /**
   * Kubernetes API server base URL (without the trailing slash).
   */
  k8sBaseURL: string;
};

let config: Readonly<UtilsConfig> | undefined;

/**
 * Set the {@link UtilsConfig} reference.
 *
 * This must be done before using any of the Kubernetes utilities.
 */
export const setUtilsConfig = (c: UtilsConfig) => {
  if (config !== undefined) {
    throw new Error('UtilsConfig reference has already been set');
  }

  config = Object.freeze({ ...c });
};

/**
 * Get the {@link UtilsConfig} reference.
 *
 * Throws an error if the reference isn't already set.
 */
export const getUtilsConfig = () => {
  if (config === undefined) {
    throw new Error('UtilsConfig reference has not been set');
  }

  return config;
};
