import { PluginStore } from '../runtime/PluginStore';
import type { LoadedExtension } from '../types/extension';
import type { PluginManifest } from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';

/**
 * `PluginStore` implementation intended for testing purposes.
 */
export class TestPluginStore extends PluginStore {
  // Override to change access to public
  override addPendingPlugin(manifest: PluginManifest) {
    super.addPendingPlugin(manifest);
  }

  // Override to change access to public
  override addLoadedPlugin(
    manifest: PluginManifest,
    entryModule: PluginEntryModule,
    loadedExtensions: LoadedExtension[],
  ) {
    super.addLoadedPlugin(manifest, entryModule, loadedExtensions);
  }

  // Override to change access to public
  override addFailedPlugin(manifest: PluginManifest, errorMessage: string, errorCause?: unknown) {
    super.addFailedPlugin(manifest, errorMessage, errorCause);
  }
}
