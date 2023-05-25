import { defaultsDeep, forOwn, isPlainObject } from 'lodash';
import type { AnyObject } from '../types/common';

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
