import { v4 as uuidv4 } from 'uuid';
import type { AnyObject, EitherNotBoth } from '@monorepo/common';
import { consoleLogger, ErrorWithCause } from '@monorepo/common';
import { cloneDeep, compact, isEqual, noop, pickBy } from 'lodash';
import { version as sdkVersion } from '../../package.json';
import type { LoadedExtension } from '../types/extension';
import type { PluginLoaderInterface } from '../types/loader';
import type { PluginManifest, PendingPlugin, LoadedPlugin, FailedPlugin } from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';
import type { PluginInfoEntry, PluginStoreInterface, FeatureFlags } from '../types/store';
import { PluginEventType } from '../types/store';
import { decodeCodeRefs, getPluginModule } from './coderefs';
import { PluginLoader } from './PluginLoader';
import type { PluginLoaderOptions } from './PluginLoader';

export type PluginStoreLoaderSettings = EitherNotBoth<
  {
    /**
     * Options passed to `PluginLoader` instance created by the `PluginStore`.
     */
    loaderOptions?: PluginLoaderOptions;
  },
  {
    /**
     * Custom `PluginLoader` implementation to be used by the `PluginStore`.
     */
    loader: PluginLoaderInterface;
  }
>;

export type PluginStoreOptions = Partial<{
  /**
   * Control whether to enable plugins automatically once they are loaded.
   *
   * Default value: `true`.
   */
  autoEnableLoadedPlugins: boolean;
}>;

/**
 * Manages plugins and their extensions.
 */
export class PluginStore implements PluginStoreInterface {
  private readonly options: Required<PluginStoreOptions>;

  private readonly loader: PluginLoaderInterface;

  private readonly pendingPromises = new Map<string, Promise<void>>();

  /** Plugins that are currently being loaded. */
  private readonly pendingPlugins = new Map<string, PendingPlugin>();

  /** Plugins that were successfully loaded and processed. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin>();

  /** Plugins that failed to load or get processed properly. */
  private readonly failedPlugins = new Map<string, FailedPlugin>();

  /** Extensions which are currently in use. */
  private extensions: LoadedExtension[] = [];

  /** Subscribed event listeners. */
  private readonly listeners = new Map<PluginEventType, Set<VoidFunction>>();

  /** Feature flags used to determine the availability of extensions. */
  private featureFlags: FeatureFlags = {};

  readonly sdkVersion = sdkVersion;

  constructor(options: PluginStoreOptions & PluginStoreLoaderSettings = {}) {
    this.options = {
      autoEnableLoadedPlugins: options.autoEnableLoadedPlugins ?? true,
    };

    this.loader = options.loader ?? new PluginLoader(options.loaderOptions);

    Object.values(PluginEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  subscribe(eventTypes: PluginEventType[], listener: VoidFunction): VoidFunction {
    let isSubscribed = true;

    if (eventTypes.length === 0) {
      consoleLogger.warn('subscribe method called with empty eventTypes');
      return noop;
    }

    eventTypes.forEach((t) => {
      this.listeners.get(t)?.add(listener);
    });

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        eventTypes.forEach((t) => {
          this.listeners.get(t)?.delete(listener);
        });
      }
    };
  }

  private invokeListeners(eventType: PluginEventType) {
    this.listeners.get(eventType)?.forEach((listener) => {
      listener();
    });
  }

  getExtensions() {
    return [...this.extensions];
  }

  getPluginInfo() {
    const entries: PluginInfoEntry[] = [];

    Array.from(this.pendingPlugins.values()).forEach((plugin) => {
      entries.push({
        status: 'pending',
        manifest: plugin.manifest,
      });
    });

    Array.from(this.loadedPlugins.values()).forEach((plugin) => {
      entries.push({
        status: 'loaded',
        manifest: plugin.manifest,
        enabled: plugin.enabled,
        disableReason: plugin.disableReason,
      });
    });

    Array.from(this.failedPlugins.values()).forEach((plugin) => {
      entries.push({
        status: 'failed',
        manifest: plugin.manifest,
        errorMessage: plugin.errorMessage,
        errorCause: plugin.errorCause,
      });
    });

    return entries;
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  setFeatureFlags(newFlags: FeatureFlags) {
    const prevFeatureFlags = this.featureFlags;

    this.featureFlags = {
      ...this.featureFlags,
      ...pickBy(newFlags, (value) => typeof value === 'boolean'),
    };

    if (!isEqual(prevFeatureFlags, this.featureFlags)) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.FeatureFlagsChanged);
    }
  }

  async loadPlugin(manifest: PluginManifest | string, forceReload?: boolean) {
    let loadedManifest: PluginManifest;

    try {
      loadedManifest =
        typeof manifest === 'string' ? await this.loader.loadPluginManifest(manifest) : manifest;
    } catch (e) {
      throw new ErrorWithCause('Failed to load plugin manifest', e);
    }

    loadedManifest = this.loader.transformPluginManifest(loadedManifest);

    const pluginName = loadedManifest.name;

    if (this.pendingPlugins.has(pluginName)) {
      return this.pendingPromises.get(pluginName);
    }

    if (this.loadedPlugins.has(pluginName) && !forceReload) {
      return Promise.resolve();
    }

    this.addPendingPlugin(loadedManifest);

    consoleLogger.info(`Loading plugin ${pluginName} version ${loadedManifest.version}`);

    const promise = (async () => {
      const result = await this.loader.loadPlugin(loadedManifest);

      if (result.success) {
        this.addLoadedPlugin(loadedManifest, result.entryModule);

        consoleLogger.info(`Plugin ${pluginName} has been loaded`);

        if (this.options.autoEnableLoadedPlugins) {
          this.enablePlugins([pluginName]);
        }
      } else {
        const { errorMessage, errorCause } = result;

        this.addFailedPlugin(loadedManifest, errorMessage, errorCause);

        consoleLogger.error(
          `Plugin ${pluginName} has failed to load`,
          ...compact([errorMessage, errorCause]),
        );
      }

      this.pendingPromises.delete(pluginName);
    })();

    this.pendingPromises.set(pluginName, promise);

    return promise;
  }

  private setPluginsEnabled(
    pluginNames: string[],
    enabled: boolean,
    onEnabledChange: (plugin: LoadedPlugin) => void,
  ) {
    let updateRequired = false;

    pluginNames.forEach((pluginName) => {
      if (!this.loadedPlugins.has(pluginName)) {
        consoleLogger.warn(
          `Attempt to ${
            enabled ? 'enable' : 'disable'
          } plugin ${pluginName} which is not currently loaded`,
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const plugin = this.loadedPlugins.get(pluginName)!;

      if (plugin.enabled !== enabled) {
        plugin.enabled = enabled;
        onEnabledChange(plugin);
        updateRequired = true;

        consoleLogger.info(`Plugin ${pluginName} will be ${enabled ? 'enabled' : 'disabled'}`);
      }
    });

    if (updateRequired) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.PluginInfoChanged);
    }
  }

  enablePlugins(pluginNames: string[]) {
    this.setPluginsEnabled(pluginNames, true, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = undefined;
    });
  }

  disablePlugins(pluginNames: string[], disableReason?: string) {
    this.setPluginsEnabled(pluginNames, false, (plugin) => {
      // eslint-disable-next-line no-param-reassign
      plugin.disableReason = disableReason;
    });
  }

  private isExtensionInUse(extension: LoadedExtension) {
    return (
      (extension.flags?.required?.every((f) => this.featureFlags[f] === true) ?? true) &&
      (extension.flags?.disallowed?.every((f) => this.featureFlags[f] === false) ?? true)
    );
  }

  private updateExtensions() {
    const prevExtensions = this.extensions;

    this.extensions = Array.from(this.loadedPlugins.values()).reduce<LoadedExtension[]>(
      (acc, p) =>
        p.enabled ? [...acc, ...p.loadedExtensions.filter((e) => this.isExtensionInUse(e))] : acc,
      [],
    );

    if (!isEqual(prevExtensions, this.extensions)) {
      this.invokeListeners(PluginEventType.ExtensionsChanged);
    }
  }

  protected addPendingPlugin(manifest: PluginManifest) {
    const pluginName = manifest.name;

    this.pendingPlugins.set(pluginName, { manifest });
    this.loadedPlugins.delete(pluginName);
    this.failedPlugins.delete(pluginName);

    this.invokeListeners(PluginEventType.PluginInfoChanged);
    this.updateExtensions();
  }

  /**
   * Add a loaded plugin to the {@link PluginStore}.
   *
   * Once added, the plugin is disabled by default. Enable it to put its extensions into use.
   */
  protected addLoadedPlugin(manifest: PluginManifest, entryModule: PluginEntryModule) {
    const pluginName = manifest.name;
    const buildHash = manifest.buildHash ?? uuidv4();

    const loadedExtensions = cloneDeep(manifest.extensions).map<LoadedExtension>((e, index) =>
      decodeCodeRefs(
        {
          ...e,
          pluginName,
          uid: `${pluginName}[${index}]_${buildHash}`,
        },
        entryModule,
      ),
    );

    const loadedPlugin: LoadedPlugin = {
      // TODO(vojtech): use deepFreeze on the manifest and type it as DeepReadonly
      manifest: Object.freeze(manifest),
      loadedExtensions: loadedExtensions.map((e) => Object.freeze(e)),
      entryModule,
      enabled: false,
    };

    this.pendingPlugins.delete(pluginName);
    this.loadedPlugins.set(pluginName, loadedPlugin);
    this.failedPlugins.delete(pluginName);

    this.invokeListeners(PluginEventType.PluginInfoChanged);
    this.updateExtensions();
  }

  protected addFailedPlugin(manifest: PluginManifest, errorMessage: string, errorCause?: unknown) {
    const pluginName = manifest.name;

    this.pendingPlugins.delete(pluginName);
    this.loadedPlugins.delete(pluginName);
    this.failedPlugins.set(pluginName, { manifest, errorMessage, errorCause });

    this.invokeListeners(PluginEventType.PluginInfoChanged);
    this.updateExtensions();
  }

  async getExposedModule<TModule extends AnyObject>(pluginName: string, moduleName: string) {
    if (!this.loadedPlugins.has(pluginName)) {
      throw new Error(
        `Attempt to get module '${moduleName}' of plugin ${pluginName} which is not currently loaded`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const plugin = this.loadedPlugins.get(pluginName)!;

    const referencedModule = await getPluginModule<TModule>(
      moduleName,
      plugin.entryModule,
      (message) => `${message} of plugin ${pluginName}`,
    );

    return referencedModule;
  }
}
