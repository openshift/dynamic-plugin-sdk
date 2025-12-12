import { PluginStore } from '../runtime/PluginStore';

/**
 * `PluginStore` implementation intended for testing purposes.
 */
export class TestPluginStore extends PluginStore {
  // Override to change access to public
  override addPendingPlugin(...args: Parameters<PluginStore['addPendingPlugin']>) {
    super.addPendingPlugin(...args);
  }

  // Override to change access to public
  override addLoadedPlugin(...args: Parameters<PluginStore['addLoadedPlugin']>) {
    super.addLoadedPlugin(...args);
  }

  // Override to change access to public
  override addFailedPlugin(...args: Parameters<PluginStore['addFailedPlugin']>) {
    super.addFailedPlugin(...args);
  }
}
