import { cloneDeepWith, defaultsDeep, forOwn, isPlainObject } from 'lodash';
import type { AnyObject } from '../types/common';
import type { DeepReadonly } from '../types/objects';

/**
 * Create new object by recursively assigning property defaults to `obj`.
 */
export const applyDefaults = <TObject>(obj: TObject, defaults: unknown): TObject =>
  defaultsDeep({}, obj, defaults);

/**
 * Create new object by recursively assigning property overrides to `obj`.
 */
export const applyOverrides = <TObject>(obj: TObject, overrides: unknown): TObject =>
  defaultsDeep({}, overrides, obj);

/**
 * Recursive equivalent of Lodash `forOwn` function that traverses objects and arrays.
 */
export const visitDeep = <TValue>(
  obj: AnyObject,
  predicate: (value: unknown) => value is TValue,
  valueCallback: (value: TValue, key: string, container: AnyObject) => void,
  isObject: (obj: unknown) => obj is AnyObject = (o): o is AnyObject => isPlainObject(o),
) => {
  forOwn(obj, (value: unknown, key: string, container: AnyObject) => {
    if (predicate(value)) {
      valueCallback(value, key, container);
    } else if (isObject(value)) {
      visitDeep(value, predicate, valueCallback, isObject);
    } else if (Array.isArray(value)) {
      value.forEach((element) => {
        visitDeep(element, predicate, valueCallback, isObject);
      });
    }
  });
};

/**
 * Variation of Lodash `cloneDeep` function that keeps existing object references
 * for uncloneable values (functions, DOM nodes, `WeakMap` and `Error` objects).
 *
 * @see https://github.com/lodash/lodash/blob/dec55b7a3b382da075e2eac90089b4cd00a26cbb/lodash.js#L323
 */
export const cloneDeepOnlyCloneableValues = <TObject>(obj: TObject): TObject =>
  cloneDeepWith(obj, (value) => {
    const tag = Object.prototype.toString.call(value);

    return tag === '[object Function]' || tag === '[object Error]' || tag === '[object WeakMap]'
      ? value
      : undefined;
  });

/**
 * Recursively freeze `obj` using `Object.freeze` and return the frozen object.
 */
export const freezeDeep = <T extends object>(obj: T): DeepReadonly<T> => {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((key) => {
    const value = (obj as AnyObject)[key];

    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      freezeDeep(value);
    }
  });

  return obj as DeepReadonly<T>;
};
