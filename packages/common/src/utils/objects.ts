import * as _ from 'lodash-es';

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
