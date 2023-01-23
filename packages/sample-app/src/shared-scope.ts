/// <reference types="webpack/module" />

const SHARED_SCOPE_NAME = 'default';

/**
 * Initialize the webpack share scope object.
 *
 * The host application should use webpack `ModuleFederationPlugin` to declare modules
 * shared between the application and its plugins.
 *
 * @example
 * ```ts
 * new ModuleFederationPlugin({
 *   shared: {
 *     react: { eager: true, singleton: true }
 *   }
 * })
 * ```
 */
export const initSharedScope = async () => __webpack_init_sharing__(SHARED_SCOPE_NAME);

/**
 * Get the webpack share scope object.
 */
export const getSharedScope = () => {
  if (!Object.keys(__webpack_share_scopes__).includes(SHARED_SCOPE_NAME)) {
    throw new Error('Attempt to access share scope object before its initialization');
  }

  return __webpack_share_scopes__[SHARED_SCOPE_NAME];
};
