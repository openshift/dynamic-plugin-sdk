/**
 * Union of all primitive types.
 *
 * With strict null checks enabled, `null` and `undefined` must be explicitly included.
 */
export type Primitive = string | number | bigint | boolean | symbol | null | undefined;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

export type DeepReadonlyObject<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

/**
 * Recursive variant of `Readonly<T>` that supports objects and arrays.
 *
 * @see https://github.com/microsoft/TypeScript/issues/13923#issuecomment-372258196
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? DeepReadonlyArray<U>
    : DeepReadonlyObject<T>;
