import type { ResourceFetch } from '@monorepo/common';
import type { Store } from 'redux';
import type { WebSocketAppSettings, WebSocketOptions } from './web-socket/types';

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
   * Configure the web socket settings for your application.
   */
  wsAppSettings: (
    options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
  ) => Promise<WebSocketAppSettings>;
};

let config: Readonly<UtilsConfig> | undefined;

/**
 * Checks if the {@link UtilsConfig} is set.
 */
export const isUtilsConfigSet = (): boolean => {
  return config !== undefined;
};

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
export const getUtilsConfig = (): UtilsConfig => {
  if (config === undefined) {
    throw new Error('UtilsConfig reference has not been set');
  }

  return config;
};

let reduxStore: Store;

/**
 * Set the {@link Store} reference.
 *
 * This must be done before using the AppInitSDK React entrypoint
 */
export const setReduxStore = (storeData: Store) => {
  reduxStore = storeData;
};

/**
 * Get the {@link Store} reference.
 *
 * Throws an error if the reference isn't already set.
 */
export const getReduxStore = () => {
  if (reduxStore === undefined) {
    throw new Error('Redux store reference has not been set');
  }

  return reduxStore;
};
