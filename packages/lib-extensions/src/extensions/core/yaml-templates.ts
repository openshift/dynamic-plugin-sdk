import type { Extension, CodeRef } from '@openshift/dynamic-plugin-sdk';
import type { ExtensionK8sResourceIdentifier } from '../../types/common';

/** YAML templates for editing resources via the yaml editor. */
export type YAMLTemplate = Extension<
  'core.yaml-template',
  {
    /** Model associated with the template. */
    model: ExtensionK8sResourceIdentifier & {
      group: string;
      version: string;
      kind: string;
    };
    /** The YAML template. */
    template: CodeRef<string>;
    /** The name of the template. Use the name `default` to mark this as the default template. */
    name: string | 'default';
  }
>;

// Type guards

export const isYAMLTemplate = (e: Extension): e is YAMLTemplate => e.type === 'core.yaml-template';
