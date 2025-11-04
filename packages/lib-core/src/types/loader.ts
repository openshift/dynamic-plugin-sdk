import type { LoadedExtension } from './extension';
import type { PluginManifest } from './plugin';
import type { PluginEntryModule } from './runtime';

export type PluginLoadResult =
  | {
      success: true;
      entryModule: PluginEntryModule;
      loadedExtensions: LoadedExtension[];
    }
  | {
      success: false;
      errorMessage: string;
      errorCause?: unknown;
    };

/**
 * Common interface implemented by the `PluginLoader`.
 */
export type PluginLoaderInterface = {
  /**
   * Load a plugin manifest from the given URL.
   *
   * The implementation should validate the manifest object as necessary.
   */
  loadPluginManifest: (manifestURL: string) => Promise<PluginManifest>;

  /**
   * Transform the plugin manifest before loading the associated plugin.
   */
  transformPluginManifest: (manifest: PluginManifest) => PluginManifest;

  /**
   * Load a plugin from the given manifest.
   *
   * The implementation is responsible for decoding any code references in extensions
   * listed in the plugin manifest.
   *
   * The resulting Promise never rejects; any plugin load error(s) will be contained
   * within the {@link PluginLoadResult} object.
   */
  loadPlugin: (manifest: PluginManifest) => Promise<PluginLoadResult>;
};
