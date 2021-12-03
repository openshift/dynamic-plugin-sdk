import * as _ from 'lodash-es';
import type { AnyObject, AnyFunction } from '../types/common';

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends AnyFunction ? K : never }[keyof T];

/**
 * Create an object that exposes methods of the given target object.
 */
export const createMethodDelegate = <
  TObject extends object,
  TObjectMethods extends FunctionPropertyNames<TObject>,
>(
  /** Target object to delegate to. */
  target: TObject,
  /** Methods on the target object to expose on the delegate object. */
  methodNames: TObjectMethods[],
) => {
  const methods = _.pick(target, methodNames);
  const delegate: AnyObject = {};

  Object.keys(methods).forEach((methodName) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delegate[methodName] = (target as any)[methodName];
  });

  return delegate as Pick<TObject, TObjectMethods>;
};
