/// <reference types="webpack/module" />

/**
 * Initialize a webpack share scope object.
 *
 * The host application should use webpack `ModuleFederationPlugin` to declare
 * modules shared between the application and its plugins. For example:
 *
 * ```ts
 * new ModuleFederationPlugin({
 *   shared: {
 *     react: { eager: true, singleton: true }
 *   }
 * })
 * ```
 */
export const initSharedScope = async (name = 'default') => __webpack_init_sharing__(name);

/**
 * Get a webpack share scope object.
 */
export const getSharedScope = (name = 'default') => {
  if (!Object.keys(__webpack_share_scopes__).includes(name)) {
    throw new Error(`Attempt to access share scope ${name} before its initialization`);
  }

  return __webpack_share_scopes__[name];
};
