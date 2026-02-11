import type { LocalPluginManifest } from '../types/plugin';
import { PluginStore } from './PluginStore';

const FOO_MANIFEST_TEMPLATE: LocalPluginManifest = {
  name: 'foo-plugin',
  version: '1.0.0',
  registrationMethod: 'local',
  extensions: [],
};

const BAR_MANIFEST_TEMPLATE: LocalPluginManifest = {
  name: 'bar-plugin',
  version: '2.0.0',
  registrationMethod: 'local',
  extensions: [],
};

const BAZ_MANIFEST_TEMPLATE: LocalPluginManifest = {
  name: 'baz-plugin',
  version: '1.0.0',
  registrationMethod: 'local',
  extensions: [],
};

const createTestPluginStore = (allowedPlugins: string[]) => {
  const allowed = new Set(allowedPlugins);
  return new PluginStore({
    loaderOptions: {
      canLoadPlugin: (manifest) => allowed.has(manifest.name),
      isDependencyResolvable: (name, isOptional) => !isOptional || allowed.has(name),
      entryCallbackSettings: {
        registerCallback: false,
      },
    },
  });
};

const getPluginStatus = (store: PluginStore, name: string) =>
  store.getPluginInfo().filter((p) => p.manifest.name === name)[0]?.status;

describe('PluginStore dependencies', () => {
  it('foo depends on bar, bar is available: both are loaded', async () => {
    const store = createTestPluginStore(['foo-plugin', 'bar-plugin']);

    const barManifest = { ...BAR_MANIFEST_TEMPLATE };
    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      dependencies: { 'bar-plugin': '~2.0.0' },
    };

    await Promise.all([store.loadPlugin(barManifest), store.loadPlugin(fooManifest)]);

    expect(getPluginStatus(store, 'bar-plugin')).toBe('loaded');
    expect(getPluginStatus(store, 'foo-plugin')).toBe('loaded');
  });

  it('foo depends on bar, bar is not available: foo is not loaded', async () => {
    const store = createTestPluginStore(['foo-plugin']);

    const barManifest = { ...BAR_MANIFEST_TEMPLATE };
    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      dependencies: { 'bar-plugin': '~2.0.0' },
    };

    // Load both concurrently: bar is rejected by canLoadPlugin, which causes
    // foo's required dependency resolution to fail.
    await Promise.all([store.loadPlugin(fooManifest), store.loadPlugin(barManifest)]);

    expect(getPluginStatus(store, 'bar-plugin')).toBe('failed');
    expect(getPluginStatus(store, 'foo-plugin')).toBe('failed');
  });

  it('foo optionally depends on bar, bar is available: both are loaded', async () => {
    const store = createTestPluginStore(['foo-plugin', 'bar-plugin']);

    const barManifest = { ...BAR_MANIFEST_TEMPLATE };
    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      optionalDependencies: { 'bar-plugin': '~2.0.0' },
    };

    await Promise.all([store.loadPlugin(barManifest), store.loadPlugin(fooManifest)]);

    expect(getPluginStatus(store, 'bar-plugin')).toBe('loaded');
    expect(getPluginStatus(store, 'foo-plugin')).toBe('loaded');
  });

  it('foo optionally depends on bar, bar is available but has incompatible version: only bar is loaded', async () => {
    const store = createTestPluginStore(['foo-plugin', 'bar-plugin']);

    const barManifest = { ...BAR_MANIFEST_TEMPLATE };
    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      optionalDependencies: { 'bar-plugin': '~5.0.0' },
    };

    await Promise.all([store.loadPlugin(barManifest), store.loadPlugin(fooManifest)]);

    expect(getPluginStatus(store, 'bar-plugin')).toBe('loaded');
    expect(getPluginStatus(store, 'foo-plugin')).toBe('failed');
  });

  it('foo optionally depends on bar, bar is not available: foo is loaded', async () => {
    const store = createTestPluginStore(['foo-plugin']);

    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      optionalDependencies: { 'bar-plugin': '~2.0.0' },
    };

    // bar is not in the allowed list, so isDependencyResolvable returns false
    // for the optional dep, bypassing resolution. foo loads without bar.
    await store.loadPlugin(fooManifest);

    expect(getPluginStatus(store, 'foo-plugin')).toBe('loaded');
  });

  it('foo, bar, and baz are independent, all are loaded', async () => {
    const store = createTestPluginStore(['foo-plugin', 'bar-plugin', 'baz-plugin']);

    const fooManifest = { ...FOO_MANIFEST_TEMPLATE };
    const barManifest = { ...BAR_MANIFEST_TEMPLATE };
    const bazManifest = { ...BAZ_MANIFEST_TEMPLATE };

    await Promise.all([
      store.loadPlugin(fooManifest),
      store.loadPlugin(barManifest),
      store.loadPlugin(bazManifest),
    ]);

    expect(getPluginStatus(store, 'foo-plugin')).toBe('loaded');
    expect(getPluginStatus(store, 'bar-plugin')).toBe('loaded');
    expect(getPluginStatus(store, 'baz-plugin')).toBe('loaded');
  });

  it('foo depends on bar, bar depends on baz, baz is not available: foo and bar are not loaded', async () => {
    const store = createTestPluginStore(['foo-plugin', 'bar-plugin']);

    const fooManifest: LocalPluginManifest = {
      ...FOO_MANIFEST_TEMPLATE,
      dependencies: { 'bar-plugin': '~2.0.0' },
    };
    const barManifest: LocalPluginManifest = {
      ...BAR_MANIFEST_TEMPLATE,
      dependencies: { 'baz-plugin': '~1.0.0' },
    };
    const bazManifest = { ...BAZ_MANIFEST_TEMPLATE };

    // Load all concurrently: baz is rejected by canLoadPlugin, which cascades
    // through bar (required dep on baz fails) and foo (required dep on bar fails).
    await Promise.all([
      store.loadPlugin(fooManifest),
      store.loadPlugin(barManifest),
      store.loadPlugin(bazManifest),
    ]);

    expect(getPluginStatus(store, 'baz-plugin')).toBe('failed');
    expect(getPluginStatus(store, 'bar-plugin')).toBe('failed');
    expect(getPluginStatus(store, 'foo-plugin')).toBe('failed');
  });
});
