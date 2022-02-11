import { applyDefaults } from './objects';

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
