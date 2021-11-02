import { LoadedExtension } from './types/extension';
import { PluginMetadata, LoadedPlugin } from './types/plugin';

/**
 * Provides access to runtime plugin information and extensions.
 */
export class PluginStore<TLoadedExtension extends LoadedExtension> {
  /** Extensions which are currently in use. */
  private extensionsInUse: TLoadedExtension[] = [];

  /** Plugins that were loaded successfully. */
  private readonly loadedPlugins = new Map<string, LoadedPlugin<TLoadedExtension>>();

  /** Subscribed event listeners. */
  private readonly listeners = new Map<PluginStoreEventType, Set<VoidFunction>>();

  constructor(
    /** If specified, only these plugins can be added to the `PluginStore`. */
    private readonly allowedPluginNames?: Set<string>,
  ) {
    Object.values(PluginStoreEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });
  }

  /**
   * Get all extensions which are currently in use.
   *
   * This method always returns a new array instance.
   */
  getExtensionsInUse() {
    return [...this.extensionsInUse];
  }

  private updateExtensionsInUse() {
    this.extensionsInUse = Array.from(this.loadedPlugins.values()).reduce(
      (acc, plugin) => (plugin.enabled ? [...acc, ...plugin.extensions] : acc),
      [] as TLoadedExtension[],
    );
  }

  /**
   * Subscribe to events related to the `PluginStore` operation.
   *
   * Returns a function used to unsubscribe the provided listener.
   */
  subscribe(listener: VoidFunction, eventTypes: PluginStoreEventType[]): VoidFunction {
    eventTypes.forEach((t) => {
      this.listeners.get(t)!.add(listener);
    });

    let isSubscribed = true;

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        eventTypes.forEach((t) => {
          this.listeners.get(t)!.delete(listener);
        });
      }
    };
  }

  private invokeListeners(eventTypes: PluginStoreEventType[]) {
    eventTypes.forEach((t) => {
      this.listeners.get(t)!.forEach((listener) => {
        listener();
      });
    });
  }

  /**
   * Add new plugin to the `PluginStore`.
   *
   * You need to enable the plugin via `setPluginEnabled` method to put its extensions into use.
   */
  addPlugin(metadata: PluginMetadata, extensions: TLoadedExtension[]) {
    if (this.loadedPlugins.has(metadata.name)) {
      console.warn(`Attempt to re-add plugin ${metadata.name}`);
      return;
    }

    if (!this.allowedPluginNames?.has(metadata.name)) {
      console.warn(`Attempt to add unexpected plugin ${metadata.name}`);
      return;
    }

    this.loadedPlugins.set(metadata.name, {
      metadata: Object.freeze(metadata),
      extensions: extensions.map((e) => Object.freeze(e)),
      enabled: false,
    });

    this.invokeListeners([PluginStoreEventType.PluginAdded]);

    console.log(`Added plugin ${metadata.name} version ${metadata.version}`);
  }

  /**
   * Enable or disable the given plugin.
   *
   * Enabling the plugin puts all of its extensions into use. Disabling it does the opposite.
   */
  setPluginEnabled(pluginName: string, enabled: boolean) {
    if (!this.loadedPlugins.has(pluginName)) {
      console.warn(
        `Attempt to ${enabled ? 'enable' : 'disable'} plugin ${pluginName} prior to its loading`,
      );
      return;
    }

    const plugin = this.loadedPlugins.get(pluginName)!;

    if (plugin.enabled !== enabled) {
      plugin.enabled = enabled;

      this.updateExtensionsInUse();
      this.invokeListeners([
        PluginStoreEventType.ExtensionsInUseChanged,
        PluginStoreEventType.PluginEnabledOrDisabled,
      ]);

      console.log(`Plugin ${pluginName} is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}

export enum PluginStoreEventType {
  ExtensionsInUseChanged = 'ExtensionsInUseChanged',
  PluginAdded = 'PluginAdded',
  PluginEnabledOrDisabled = 'PluginEnabledOrDisabled',
}
