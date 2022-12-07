import type { AnyObject } from '@openshift/dynamic-plugin-sdk';

// Type for extension hook
export type ExtensionHook<TResult, TOptions extends AnyObject = AnyObject> = (
  options: TOptions,
) => [TResult, boolean, unknown];

// TODO(vojtech): use types like RequiredProperties<T, K> and OptionalProperties<T, K>
// to change optionality of specific properties, instead of redefining them via "&" intersection
export type ExtensionK8sResourceIdentifier = {
  group?: string;
  version?: string;
  kind?: string;
};
