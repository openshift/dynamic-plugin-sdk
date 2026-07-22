import { applyDefaults, cloneDeepOnlyCloneableValues, freezeDeep } from './objects';

describe('applyDefaults', () => {
  it('should recursively assign defaults for properties which are undefined', () => {
    expect(
      applyDefaults(
        {
          foo: 1,
          bar: {
            qux: 'test',
          },
        },
        {
          foo: true,
          bar: {
            qux: 2,
            mux: false,
          },
          baz: 'bang',
        },
      ),
    ).toEqual({
      foo: 1,
      bar: {
        qux: 'test',
        mux: false,
      },
      baz: 'bang',
    });
  });

  it('should return a new object', () => {
    const obj = { foo: 1 };
    expect(applyDefaults(obj, {})).not.toBe(obj);
  });
});

describe('cloneDeepOnlyCloneableValues', () => {
  it('should create new object references for cloneable values', () => {
    const source = {
      foo: { bar: [1, 'qux', { test: true }] as [number, string, { test: boolean }] },
    };

    const clone = cloneDeepOnlyCloneableValues(source);

    expect(clone).not.toBe(source);
    expect(clone).toEqual(source);

    expect(clone.foo).not.toBe(source.foo);
    expect(clone.foo.bar).not.toBe(source.foo.bar);
    expect(clone.foo.bar[0]).toBe(source.foo.bar[0]);
    expect(clone.foo.bar[1]).toBe(source.foo.bar[1]);
    expect(clone.foo.bar[2]).not.toBe(source.foo.bar[2]);
    expect(clone.foo.bar[2].test).toBe(source.foo.bar[2].test);

    clone.foo.bar[0] = 2;
    clone.foo.bar[1] = 'mux';

    expect(clone.foo.bar[0]).not.toBe(source.foo.bar[0]);
    expect(clone.foo.bar[1]).not.toBe(source.foo.bar[1]);
  });

  it('should keep existing object references for uncloneable values', () => {
    const source = [() => true, new Error('boom'), new WeakMap(), document.createElement('div')];

    const clone = cloneDeepOnlyCloneableValues(source);

    expect(clone).not.toBe(source);
    expect(clone).toEqual(source);

    expect(clone[0]).toBe(source[0]);
    expect(clone[1]).toBe(source[1]);
    expect(clone[2]).toBe(source[2]);
    expect(clone[3]).toBe(source[3]);
  });
});

describe('freezeDeep', () => {
  it('should return the same object reference', () => {
    const obj = { foo: 1 };

    expect(freezeDeep(obj)).toBe(obj);
  });

  it('should freeze the top-level object', () => {
    const obj = { foo: 1 };
    freezeDeep(obj);

    expect(Object.isFrozen(obj)).toBe(true);
  });

  it('should freeze nested objects', () => {
    const obj = { foo: { bar: { baz: true } } };
    freezeDeep(obj);

    expect(Object.isFrozen(obj.foo)).toBe(true);
    expect(Object.isFrozen(obj.foo.bar)).toBe(true);
  });

  it('should freeze nested arrays', () => {
    const obj = { foo: [1, 2, 3] };
    freezeDeep(obj);

    expect(Object.isFrozen(obj.foo)).toBe(true);
  });

  it('should freeze objects nested within arrays', () => {
    const obj = { items: [{ value: 'test' }] };
    freezeDeep(obj);

    expect(Object.isFrozen(obj.items[0])).toBe(true);
  });

  it('should handle non-enumerable properties', () => {
    const hidden = { secret: true };
    const obj = {};

    Object.defineProperty(obj, 'hidden', { value: hidden, enumerable: false });
    freezeDeep(obj);

    expect(Object.isFrozen(hidden)).toBe(true);
  });

  it('should not fail on objects with circular references', () => {
    const obj: Record<string, unknown> = { foo: 1 };
    obj.self = obj;
    freezeDeep(obj);

    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.self)).toBe(true);
  });
});
