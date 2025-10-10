/// <reference types="webpack/module" />

const SHARED_SCOPE_NAME = 'default';

/**
 * Initialize the webpack share scope object.
 *
 * The host application should use webpack `ModuleFederationPlugin` or `SharePlugin`
 * to declare application provided shared modules.
 *
 * At runtime, plugins may add new modules to the share scope object as part of their
 * loading process.
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
