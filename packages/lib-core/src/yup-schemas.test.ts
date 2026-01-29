import { ValidationError } from 'yup';
import {
  semverStringSchema,
  recordStringStringSchema,
  recordStringSemverRangeSchema,
} from './yup-schemas';

describe('semverStringSchema', () => {
  test.each([
    '0.0.1',
    '0.1.0',
    '1.0.0',
    '1.0.0-0.3.7',
    '1.0.0-x.7.z.92',
    '1.2.3-beta.1',
    '10.20.30',
  ])('valid semver string: %s', async (semver) => {
    await expect(semverStringSchema.validate(semver)).resolves.toBe(semver);
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
  ])('invalid semver string: %s', async (semver) => {
    await expect(semverStringSchema.validate(semver)).rejects.toThrow(ValidationError);
  });

  test.each([null, undefined, Symbol('sym'), 42, {}, []])(
    'invalid semver string of wrong type: %s',
    async (value) => {
      await expect(semverStringSchema.validate(value)).rejects.toThrow(ValidationError);
    },
  );
});

describe('recordStringStringSchema', () => {
  test('valid when undefined', async () => {
    await expect(recordStringStringSchema.validate(undefined)).resolves.toBeUndefined();
  });

  test('valid with string values', async () => {
    const validObj = {
      key1: 'value1',
      key2: 'value2',
    };

    await expect(recordStringStringSchema.validate(validObj)).resolves.toEqual(validObj);
  });

  test('invalid with non-string values', async () => {
    const invalidObj = {
      key1: 'value1',
      key2: 42, // Invalid non-string value
    };

    await expect(recordStringStringSchema.validate(invalidObj)).rejects.toThrow(ValidationError);
  });

  test('invalid with symbol keys', async () => {
    const sym = Symbol('symKey');
    const invalidObj = {
      key1: 'value1',
      [sym]: 'value2', // Invalid symbol key
    };

    await expect(recordStringStringSchema.validate(invalidObj)).rejects.toThrow(ValidationError);
  });
});

describe('recordStringSemverRangeSchema', () => {
  test('valid when undefined', async () => {
    await expect(recordStringSemverRangeSchema.validate(undefined)).resolves.toBeUndefined();
  });

  test('valid with correct semver ranges', async () => {
    const validObj = {
      packageA: '^1.0.0',
      packageB: '>=2.0.0 <3.0.0',
      packageC: '~1.2.3',
      packageD: '1.2.3 - 2.3.4',
      packageE: '1.2.3',
    };

    await expect(recordStringSemverRangeSchema.validate(validObj)).resolves.toEqual(validObj);
  });

  test('invalid with incorrect semver ranges', async () => {
    const invalidObj = {
      packageA: '^1.0.0',
      packageB: 'not-a-semver', // Invalid semver range
    };

    await expect(recordStringSemverRangeSchema.validate(invalidObj)).rejects.toThrow(
      ValidationError,
    );
  });

  test('invalid with non-string values', async () => {
    const invalidObj = {
      packageA: '^1.0.0',
      packageB: 42, // Invalid non-string value
    };

    await expect(recordStringSemverRangeSchema.validate(invalidObj)).rejects.toThrow(
      ValidationError,
    );
  });
});
