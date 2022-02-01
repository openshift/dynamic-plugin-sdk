/**
 * The type `{}` doesn't mean "any empty object", it means "any non-nullish value".
 *
 * Use the `AnyObject` type for objects whose structure is unknown.
 *
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492
 */
export type AnyObject = Record<string, unknown>;

/**
 * The type `Function` doesn't provide enough type safety.
 *
 * Use the `AnyFunction` type for arbitrary functions whose signature is unknown.
 *
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/1896
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any) => any;

/**
 * Replace existing direct properties of object `T` with ones declared in object `R`.
 */
export type ReplaceProperties<T extends AnyObject, R extends AnyObject> = {
  [K in keyof T]: K extends keyof R ? R[K] : T[K];
} & AnyObject;
