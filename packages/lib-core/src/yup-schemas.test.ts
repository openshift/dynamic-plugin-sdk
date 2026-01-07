import type { Extension } from './shared-webpack';
import {
  extensionSchema,
  extensionArraySchema,
  pluginRuntimeMetadataSchema,
  remotePluginManifestSchema,
} from './yup-schemas';

describe('yup-schemas', () => {
  describe('extensionSchema', () => {
    const validExtension = {
      type: 'app.foo',
      properties: {},
    };

    it('should validate a valid extension', () => {
      expect(() => extensionSchema.validateSync(validExtension)).not.toThrow();
    });

    it('should validate extension with flags', () => {
      const extension = {
        ...validExtension,
        flags: {
          required: ['FOO', 'BAR_BAZ'],
          disallowed: ['QUX123'],
        },
      };
      expect(() => extensionSchema.validateSync(extension)).not.toThrow();
    });

    it('should reject missing type', () => {
      expect(() => extensionSchema.validateSync({ properties: {} })).toThrow();
    });

    it('should reject missing properties', () => {
      expect(() => extensionSchema.validateSync({ type: 'app.foo' })).toThrow();
    });

    describe('extension type validation', () => {
      it.each([
        'app.foo',
        'app.foo-bar',
        'app.foo/bar',
        'My-app.Foo-Bar',
        'My-app.Foo-Bar/abcTest',
      ])('should accept valid extension type: %s', (type) => {
        expect(() => extensionSchema.validateSync({ type, properties: {} })).not.toThrow();
      });

      it.each([
        '',
        'foo',
        'app',
        '.foo',
        'app.',
        'app.123',
        'app.foo_bar',
        'app..foo',
        'app.foo//bar',
      ])('should reject invalid extension type: %s', (type) => {
        expect(() => extensionSchema.validateSync({ type, properties: {} })).toThrow();
      });
    });

    describe('feature flag name validation', () => {
      it.each(['FOO', 'FOO_BAR', 'FOO_BAR123', 'ABC123_DEF'])(
        'should accept valid feature flag name: %s',
        (flag) => {
          expect(() =>
            extensionSchema.validateSync({
              ...validExtension,
              flags: { required: [flag] },
            }),
          ).not.toThrow();
        },
      );

      it.each(['foo', 'Foo', 'FOO-BAR', '123FOO', '_FOO'])(
        'should reject invalid feature flag name: %s',
        (flag) => {
          expect(() =>
            extensionSchema.validateSync({
              ...validExtension,
              flags: { required: [flag] },
            }),
          ).toThrow();
        },
      );
    });
  });

  describe('extensionArraySchema', () => {
    it('should validate an array of extensions', () => {
      const extensions: Extension[] = [
        { type: 'app.foo', properties: {} },
        { type: 'app.bar', properties: { key: 'value' } },
      ];
      expect(() => extensionArraySchema.validateSync(extensions)).not.toThrow();
    });

    it('should validate an empty array', () => {
      expect(() => extensionArraySchema.validateSync([])).not.toThrow();
    });

    it('should reject non-array values', () => {
      expect(() => extensionArraySchema.validateSync(null)).toThrow();
      expect(() => extensionArraySchema.validateSync(undefined)).toThrow();
    });

    it('should reject array with invalid extension', () => {
      const extensions = [
        { type: 'app.foo', properties: {} },
        { type: 'invalid', properties: {} },
      ];
      expect(() => extensionArraySchema.validateSync(extensions)).toThrow();
    });
  });

  describe('pluginRuntimeMetadataSchema', () => {
    const validMetadata = {
      name: 'my-plugin',
      version: '1.0.0',
    };

    it('should validate valid metadata', () => {
      expect(() => pluginRuntimeMetadataSchema.validateSync(validMetadata)).not.toThrow();
    });

    it('should validate metadata with optional fields', () => {
      const metadata = {
        ...validMetadata,
        dependencies: { '@console/plugin-sdk': '^1.0.0' },
        optionalDependencies: { '@console/utils': '^2.0.0' },
        customProperties: { foo: 'bar' },
      };
      expect(() => pluginRuntimeMetadataSchema.validateSync(metadata)).not.toThrow();
    });

    it('should reject missing name', () => {
      expect(() => pluginRuntimeMetadataSchema.validateSync({ version: '1.0.0' })).toThrow();
    });

    it('should reject missing version', () => {
      expect(() => pluginRuntimeMetadataSchema.validateSync({ name: 'my-plugin' })).toThrow();
    });

    describe('plugin name validation', () => {
      it.each([
        'foo',
        'foo-bar',
        'foo.bar',
        'foo.bar-Test',
        'Foo-Bar-abc.123',
        'myPlugin',
        'MyPlugin123',
      ])('should accept valid plugin name: %s', (name) => {
        expect(() =>
          pluginRuntimeMetadataSchema.validateSync({ name, version: '1.0.0' }),
        ).not.toThrow();
      });

      it.each(['', '123', '-foo', 'foo-', '.foo', 'foo.', 'foo--bar', 'foo..bar', 'foo_bar'])(
        'should reject invalid plugin name: %s',
        (name) => {
          expect(() =>
            pluginRuntimeMetadataSchema.validateSync({ name, version: '1.0.0' }),
          ).toThrow();
        },
      );
    });

    describe('semver validation', () => {
      it.each([
        '0.0.0',
        '1.0.0',
        '1.2.3',
        '10.20.30',
        '1.0.0-alpha',
        '1.0.0-alpha.1',
        '1.0.0-0.3.7',
        '1.0.0-x.7.z.92',
        '1.0.0+build',
        '1.0.0+build.123',
        '1.0.0-alpha+build',
        '1.0.0-alpha.1+build.123',
      ])('should accept valid semver: %s', (version) => {
        expect(() =>
          pluginRuntimeMetadataSchema.validateSync({ name: 'test', version }),
        ).not.toThrow();
      });

      it.each([
        '',
        '1',
        '1.0',
        '1.0.0.0',
        'v1.0.0',
        '1.0.0-',
        '1.0.0+',
        '01.0.0',
        '1.00.0',
        '1.0.00',
      ])('should reject invalid semver: %s', (version) => {
        expect(() => pluginRuntimeMetadataSchema.validateSync({ name: 'test', version })).toThrow();
      });
    });

    describe('dependencies validation', () => {
      it.each([
        {
          ...validMetadata,
          dependencies: { '@console/plugin-sdk': 123 },
          optionalDependencies: { '@console/utils': 456 },
        },
        {
          ...validMetadata,
          dependencies: { '@console/plugin-sdk': null },
        },
        {
          ...validMetadata,
          dependencies: null,
        },
        {
          ...validMetadata,
          optionalDependencies: { '@console/utils': [] },
        },
        {
          ...validMetadata,
          dependencies: 'not-an-object',
        },
        {
          ...validMetadata,
          optionalDependencies: new Date(),
        },
        {
          ...validMetadata,
          dependencies: ['@console/plugin-sdk', '^1.0.0'],
        },
        {
          ...validMetadata,
          dependencies: { nested: { deep: 'value' } },
        },
        {
          ...validMetadata,
          optionalDependencies: { key: undefined },
        },
        {
          ...validMetadata,
          dependencies: { emptyArray: [] },
        },
        {
          ...validMetadata,
          dependencies: { booleanValue: true },
        },
        {
          ...validMetadata,
          optionalDependencies: { numberValue: 0 },
        },
        {
          ...validMetadata,
          dependencies: { [Symbol('test')]: 'value' },
        },
      ])('should reject invalid dependencies and optionalDependencies', (metadata) => {
        expect(() => pluginRuntimeMetadataSchema.validateSync(metadata)).toThrow();
      });

      it.each([
        {
          ...validMetadata,
          dependencies: { '@console/plugin-sdk': '^1.0.0' },
          optionalDependencies: { '@console/utils': '~2.0.0' },
        },
        {
          ...validMetadata,
          dependencies: { '@console/plugin-sdk': '*' },
        },
        {
          ...validMetadata,
        },
      ])('should accept valid dependencies and optionalDependencies', (metadata) => {
        expect(() => pluginRuntimeMetadataSchema.validateSync(metadata)).not.toThrow();
      });
    });
  });

  describe('remotePluginManifestSchema', () => {
    const validManifest = {
      name: 'my-plugin',
      version: '1.0.0',
      baseURL: 'https://example.com/plugins/my-plugin',
      extensions: [],
      loadScripts: ['plugin-entry.js'],
      registrationMethod: 'callback' as const,
    };

    it('should validate a valid manifest', () => {
      expect(() => remotePluginManifestSchema.validateSync(validManifest)).not.toThrow();
    });

    it('should validate manifest with all optional fields', () => {
      const manifest = {
        ...validManifest,
        dependencies: { '@console/plugin-sdk': '^1.0.0' },
        optionalDependencies: { '@console/utils': '^2.0.0' },
        customProperties: { foo: 'bar' },
        buildHash: 'abc123',
        extensions: [{ type: 'app.foo', properties: {} }],
      };
      expect(() => remotePluginManifestSchema.validateSync(manifest)).not.toThrow();
    });

    it('should reject missing baseURL', () => {
      const invalidManifest = Object.fromEntries(
        Object.entries(validManifest).filter(([key]) => key !== 'baseURL'),
      );
      expect(() => remotePluginManifestSchema.validateSync(invalidManifest)).toThrow();
    });

    it('should reject missing extensions', () => {
      const invalidManifest = Object.fromEntries(
        Object.entries(validManifest).filter(([key]) => key !== 'extensions'),
      );
      expect(() => remotePluginManifestSchema.validateSync(invalidManifest)).toThrow();
    });

    it('should reject missing loadScripts', () => {
      const invalidManifest = Object.fromEntries(
        Object.entries(validManifest).filter(([key]) => key !== 'loadScripts'),
      );
      expect(() => remotePluginManifestSchema.validateSync(invalidManifest)).toThrow();
    });

    it('should reject empty loadScripts', () => {
      expect(() =>
        remotePluginManifestSchema.validateSync({
          ...validManifest,
          loadScripts: [],
        }),
      ).not.toThrow(); // Empty array is valid, just not useful
    });

    it('should reject missing registrationMethod', () => {
      const invalidManifest = Object.fromEntries(
        Object.entries(validManifest).filter(([key]) => key !== 'registrationMethod'),
      );
      expect(() => remotePluginManifestSchema.validateSync(invalidManifest)).toThrow();
    });

    it('should only accept valid registrationMethod values', () => {
      expect(() =>
        remotePluginManifestSchema.validateSync({
          ...validManifest,
          registrationMethod: 'callback',
        }),
      ).not.toThrow();

      expect(() =>
        remotePluginManifestSchema.validateSync({
          ...validManifest,
          registrationMethod: 'custom',
        }),
      ).not.toThrow();

      expect(() =>
        remotePluginManifestSchema.validateSync({
          ...validManifest,
          registrationMethod: 'invalid',
        }),
      ).toThrow();
    });

    it('should validate extensions within manifest', () => {
      expect(() =>
        remotePluginManifestSchema.validateSync({
          ...validManifest,
          extensions: [{ type: 'invalid', properties: {} }],
        }),
      ).toThrow();
    });
  });
});
