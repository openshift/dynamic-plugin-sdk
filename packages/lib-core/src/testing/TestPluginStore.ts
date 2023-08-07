import { PluginStore } from '../runtime/PluginStore';
import type { PluginManifest } from '../types/plugin';
import type { PluginEntryModule } from '../types/runtime';

/**
 * `PluginStore` implementation intended for testing purposes.
 */
export class TestPluginStore extends PluginStore {
  override addPendingPlugin(manifest: PluginManifest) {
    super.addPendingPlugin(manifest);
  }

  override addLoadedPlugin(manifest: PluginManifest, entryModule: PluginEntryModule) {
    super.addLoadedPlugin(manifest, entryModule);
  }

  override addFailedPlugin(manifest: PluginManifest, errorMessage: string, errorCause?: unknown) {
    super.addFailedPlugin(manifest, errorMessage, errorCause);
  }
}
