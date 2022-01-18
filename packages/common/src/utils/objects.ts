import * as _ from 'lodash-es';
import type { AnyObject } from '../types/common';

/**
 * Create new object by recursively assigning property defaults to `obj`.
 *
 * @see {@link _.defaultsDeep}
 */
export const applyDefaults = <TObject>(obj: TObject, defaults: TObject): TObject =>
  _.defaultsDeep({}, obj, defaults);

/**
 * Create new object by recursively assigning property overrides to `obj`.
 *
 * @see {@link _.defaultsDeep}
 */
export const applyOverrides = <TObject>(obj: TObject, overrides: TObject): TObject =>
  _.defaultsDeep({}, overrides, obj);

/**
 * Return `true` if `obj` is a plain non-React object.
 */
export const isPlainNonReactObject = (obj: unknown): obj is AnyObject =>
  _.isPlainObject(obj) && !(obj as AnyObject).$$typeof;

/**
 * Recursive equivalent of {@link _.forOwn} function that traverses plain objects and arrays.
 */
export const visitDeep = <TValue>(
  obj: AnyObject,
  predicate: (value: unknown) => value is TValue,
  valueCallback: (value: TValue, key: string, container: AnyObject) => void,
  isPlainObject = isPlainNonReactObject,
) => {
  const visitValue = (value: unknown, key: string, container: AnyObject) => {
    if (predicate(value)) {
      valueCallback(value, key, container);
    } else if (isPlainObject(value)) {
      visitDeep(value, predicate, valueCallback, isPlainObject);
    } else if (Array.isArray(value)) {
      value.forEach((element) => {
        visitDeep(element, predicate, valueCallback, isPlainObject);
      });
    }
  };

  _.forOwn(obj, visitValue);
};
