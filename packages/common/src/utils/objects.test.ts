import { applyDefaults, cloneDeepOnlyCloneableValues } from './objects';

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
      foo: { bar: [1, { test: true }] as [number, { test: boolean }] },
    };

    const clone = cloneDeepOnlyCloneableValues(source);

    expect(clone).not.toBe(source);
    expect(clone).toEqual(source);

    expect(clone.foo).not.toBe(source.foo);
    expect(clone.foo.bar).not.toBe(source.foo.bar);
    expect(clone.foo.bar[0]).toBe(source.foo.bar[0]);
    expect(clone.foo.bar[1]).not.toBe(source.foo.bar[1]);
    expect(clone.foo.bar[1].test).toBe(source.foo.bar[1].test);
  });

  it('should keep existing object references for uncloneable values', () => {
    const source = [() => true, new Error('boom')];

    const clone = cloneDeepOnlyCloneableValues(source);

    expect(clone).not.toBe(source);
    expect(clone).toEqual(source);

    expect(clone[0]).toBe(source[0]);
    expect(clone[1]).toBe(source[1]);
  });
});
