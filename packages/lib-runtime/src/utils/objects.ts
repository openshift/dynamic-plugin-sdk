import type { AnyFunction } from '@monorepo/common';
import * as _ from 'lodash-es';

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
  const delegate = {} as Pick<TObject, TObjectMethods>;

  const validMethodNames = methodNames.filter((methodName) => _.isFunction(target[methodName]));

  if (!_.isEqual(methodNames, validMethodNames)) {
    throw new Error(
      `Missing or invalid methods on target object: ${_.difference(
        methodNames,
        validMethodNames,
      ).join(', ')}`,
    );
  }

  validMethodNames.forEach((methodName) => {
    delegate[methodName] = target[methodName];
  });

  return delegate;
};
