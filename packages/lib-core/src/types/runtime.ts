import type { AnyObject } from '@monorepo/common';

/**
 * Remote webpack container interface.
 *
 * @see https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
 */
export type PluginEntryModule = {
  /** Initialize the container with shared modules. */
  init: (sharedScope: AnyObject) => Promise<void>;
  /** Get a module exposed through the container. */
  get: <TModule extends AnyObject>(moduleRequest: string) => Promise<() => TModule>;
};

/**
 * Called by plugin entry scripts to register the given plugin with host application.
 */
export type PluginEntryCallback = (pluginName: string, entryModule: PluginEntryModule) => void;
