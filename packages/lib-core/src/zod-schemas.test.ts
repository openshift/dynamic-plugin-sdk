import { ZodError } from 'zod';
import {
  extensionTypeSchema,
  featureFlagNameSchema,
  pluginNameSchema,
  semverRangeSchema,
  semverStringSchema,
} from './zod-schemas';

describe('semverStringSchema', () => {
  test.each([
    '0.0.1',
    '0.1.0',
    '1.0.0',
    '1.0.0-0.3.7',
    '1.0.0-x.7.z.92',
    '1.2.3-beta.1',
    '10.20.30',
  ])('valid semver string: %s', (value) => {
    expect(semverStringSchema.parse(value)).toBe(value);
  });

  test.each([
    'Trusty Tahr',
    '1.0',
    '1.0.0+build..123',
    '1.0.0-beta+build+123',
    '1.0.0-beta..1',
    '1.2.3+build.123',
    '1.2.3-beta.1+build.123',
    'v1.0.0',
  ])('invalid semver string: %s', (value) => {
    expect(() => semverStringSchema.parse(value)).toThrow(ZodError);
  });
});

describe('semverRangeSchema', () => {
  test.each([
    '^1.0.0',
    '~1.2.3',
    '<3.0.0',
    '>=2.0.0 <3.0.0',
    '2.x || 3.x',
    '1.2.3 - 2.3.4',
    '1.2.3',
    '=1.2.3',
  ])('valid semver range: %s', (value) => {
    expect(semverRangeSchema.parse(value)).toBe(value);
  });

  test.each(['=>1.0.0', 'not-a-semver'])('invalid semver range: %s', (value) => {
    expect(() => semverRangeSchema.parse(value)).toThrow(ZodError);
  });
});

describe('pluginNameSchema', () => {
  test.each(['foo', 'foo-bar', 'foo.bar', 'foo.bar-Test', 'foo-bar.Test-1', 'Foo-Bar-test.123'])(
    'valid plugin name: %s',
    (value) => {
      expect(pluginNameSchema.parse(value)).toBe(value);
    },
  );

  test.each([
    '1',
    '1foo',
    '1.foo',
    '1-foo.bar',
    '.foo',
    '-foo.bar',
    'foo..bar',
    'foo.bar--Test',
    'foo..',
    'foo.bar--',
  ])('invalid plugin name: %s', (value) => {
    expect(() => pluginNameSchema.parse(value)).toThrow(ZodError);
  });
});

describe('extensionTypeSchema', () => {
  test.each([
    'app.foo',
    'app.foo-bar',
    'app.foo/bar',
    'My-app.Foo-Bar',
    'My-app.Foo-Bar/abcTest',
    'My-app.Foo-Bar/abcTest/Test',
  ])('valid extension type: %s', (value) => {
    expect(extensionTypeSchema.parse(value)).toBe(value);
  });

  test.each([
    'app',
    '1app.foo',
    '.app.foo',
    '1-app.foo',
    'app.foo.',
    'app.foo/bar.',
    'app.foo/bar.Test',
  ])('invalid extension type: %s', (value) => {
    expect(() => extensionTypeSchema.parse(value)).toThrow(ZodError);
  });
});

describe('featureFlagNameSchema', () => {
  test.each(['FOO', 'FOO_BAR', 'FOO_BAR123'])('valid feature flag name: %s', (value) => {
    expect(featureFlagNameSchema.parse(value)).toBe(value);
  });

  test.each(['1_FOO', '_FOO', 'FOO_BAR_', 'FOO.BAR', 'FOO_bar'])(
    'invalid feature flag name: %s',
    (value) => {
      expect(() => featureFlagNameSchema.parse(value)).toThrow(ZodError);
    },
  );
});
