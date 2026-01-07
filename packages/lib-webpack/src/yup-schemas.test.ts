import {
  pluginBuildMetadataSchema,
  dynamicRemotePluginAdaptedOptionsSchema,
} from './yup-schemas';

describe('yup-schemas', () => {
  describe('pluginBuildMetadataSchema', () => {
    const validMetadata = {
      name: 'my-plugin',
      version: '1.0.0',
    };

    it('should validate valid build metadata', () => {
      expect(() =>
        pluginBuildMetadataSchema.validateSync(validMetadata),
      ).not.toThrow();
    });

    it('should validate metadata with exposedModules', () => {
      const metadata = {
        ...validMetadata,
        exposedModules: {
          testComponent: './src/test-component',
          anotherModule: './src/another-module',
        },
      };
      expect(() =>
        pluginBuildMetadataSchema.validateSync(metadata),
      ).not.toThrow();
    });

    it('should validate metadata with all optional fields', () => {
      const metadata = {
        ...validMetadata,
        dependencies: { '@console/plugin-sdk': '^1.0.0' },
        optionalDependencies: { '@console/utils': '^2.0.0' },
        customProperties: { foo: 'bar' },
        exposedModules: { testComponent: './src/test-component' },
      };
      expect(() =>
        pluginBuildMetadataSchema.validateSync(metadata),
      ).not.toThrow();
    });

    it('should reject missing name', () => {
      expect(() =>
        pluginBuildMetadataSchema.validateSync({ version: '1.0.0' }),
      ).toThrow();
    });

    it('should reject missing version', () => {
      expect(() =>
        pluginBuildMetadataSchema.validateSync({ name: 'my-plugin' }),
      ).toThrow();
    });

    it('should reject invalid plugin name', () => {
      expect(() =>
        pluginBuildMetadataSchema.validateSync({
          name: '123-invalid',
          version: '1.0.0',
        }),
      ).toThrow();
    });

    it('should reject invalid semver version', () => {
      expect(() =>
        pluginBuildMetadataSchema.validateSync({
          name: 'my-plugin',
          version: 'invalid',
        }),
      ).toThrow();
    });
  });

  describe('dynamicRemotePluginAdaptedOptionsSchema', () => {
    const validOptions = {
      pluginMetadata: {
        name: 'my-plugin',
        version: '1.0.0',
      },
      extensions: [],
      sharedModules: {},
      moduleFederationSettings: {},
      entryCallbackSettings: {},
      entryScriptFilename: 'plugin-entry.js',
      pluginManifestFilename: 'plugin-manifest.json',
    };

    it('should validate valid options', () => {
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(validOptions),
      ).not.toThrow();
    });

    it('should validate options with all fields populated', () => {
      const options = {
        pluginMetadata: {
          name: 'my-plugin',
          version: '1.0.0',
          dependencies: { '@console/plugin-sdk': '^1.0.0' },
          optionalDependencies: { '@console/utils': '^2.0.0' },
          customProperties: { foo: 'bar' },
          exposedModules: { testComponent: './src/test-component' },
        },
        extensions: [{ type: 'app.foo', properties: {} }],
        sharedModules: { react: { singleton: true } },
        moduleFederationSettings: {
          libraryType: 'jsonp',
          sharedScopeName: 'default',
        },
        entryCallbackSettings: {
          name: '__load_plugin_entry__',
          pluginID: 'my-plugin',
        },
        entryScriptFilename: 'plugin-entry.[contenthash].js',
        pluginManifestFilename: 'plugin-manifest.json',
      };
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).not.toThrow();
    });

    it('should reject missing pluginMetadata', () => {
      const { pluginMetadata, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).toThrow();
    });

    it('should reject missing extensions', () => {
      const { extensions, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).toThrow();
    });

    it('should reject missing sharedModules', () => {
      const { sharedModules, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).toThrow();
    });

    it('should accept missing moduleFederationSettings (defaults to empty object)', () => {
      const { moduleFederationSettings, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).not.toThrow();
    });

    it('should accept missing entryCallbackSettings (defaults to empty object)', () => {
      const { entryCallbackSettings, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).not.toThrow();
    });

    it('should reject null moduleFederationSettings', () => {
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync({
          ...validOptions,
          moduleFederationSettings: null,
        }),
      ).toThrow();
    });

    it('should reject null entryCallbackSettings', () => {
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync({
          ...validOptions,
          entryCallbackSettings: null,
        }),
      ).toThrow();
    });

    it('should reject missing entryScriptFilename', () => {
      const { entryScriptFilename, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).toThrow();
    });

    it('should reject missing pluginManifestFilename', () => {
      const { pluginManifestFilename, ...options } = validOptions;
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync(options),
      ).toThrow();
    });

    it('should validate extensions within options', () => {
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync({
          ...validOptions,
          extensions: [{ type: 'invalid', properties: {} }],
        }),
      ).toThrow();
    });

    it('should reject invalid pluginMetadata', () => {
      expect(() =>
        dynamicRemotePluginAdaptedOptionsSchema.validateSync({
          ...validOptions,
          pluginMetadata: {
            name: '123-invalid',
            version: '1.0.0',
          },
        }),
      ).toThrow();
    });

    describe('moduleFederationSettings validation', () => {
      it('should accept valid libraryType', () => {
        expect(() =>
          dynamicRemotePluginAdaptedOptionsSchema.validateSync({
            ...validOptions,
            moduleFederationSettings: { libraryType: 'jsonp' },
          }),
        ).not.toThrow();
      });

      it('should accept valid sharedScopeName', () => {
        expect(() =>
          dynamicRemotePluginAdaptedOptionsSchema.validateSync({
            ...validOptions,
            moduleFederationSettings: { sharedScopeName: 'custom-scope' },
          }),
        ).not.toThrow();
      });
    });

    describe('entryCallbackSettings validation', () => {
      it('should accept valid name', () => {
        expect(() =>
          dynamicRemotePluginAdaptedOptionsSchema.validateSync({
            ...validOptions,
            entryCallbackSettings: { name: '__custom_callback__' },
          }),
        ).not.toThrow();
      });

      it('should accept valid pluginID', () => {
        expect(() =>
          dynamicRemotePluginAdaptedOptionsSchema.validateSync({
            ...validOptions,
            entryCallbackSettings: { pluginID: 'custom-plugin-id' },
          }),
        ).not.toThrow();
      });
    });
  });
});
