import type { ExtensionK8sResourceIdentifier } from '../types/common';
import type { CodeRef, Extension } from '../types/extension';

/** Gives full control over host application's feature flags. */
export type FeatureFlag = Extension<
  'core.flag',
  {
    /** Used to set/unset arbitrary feature flags. */
    handler: CodeRef<(callback: SetFeatureFlag) => void>;
  }
>;

/** Adds new feature flag to host application driven by the presence of a CRD on the cluster. */
export type ModelFeatureFlag = Extension<
  'core.flag/model',
  {
    /** The name of the flag to set once the CRD is detected. */
    flag: string;
    /** The model which refers to a `CustomResourceDefinition`. */
    model: ExtensionK8sResourceIdentifier & {
      group: string;
      version: string;
      kind: string;
    };
  }
>;

// Type guards

export const isFeatureFlag = (e: Extension): e is FeatureFlag => e.type === 'core.flag';
export const isModelFeatureFlag = (e: Extension): e is ModelFeatureFlag =>
  e.type === 'core.flag/model';

// Arbitrary types

export type SetFeatureFlag = (flag: string, enabled: boolean) => void;
