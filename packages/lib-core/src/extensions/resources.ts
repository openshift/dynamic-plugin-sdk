import type { ComponentType } from 'react';
import type { ExtensionK8sResourceIdentifier } from '../types/common';
import type { CodeRef, Extension } from '../types/extension';

export type CreateResource = Extension<
  'core.resource/create',
  {
    /** The model for which this create resource page will be rendered. */
    model: ExtensionK8sResourceIdentifier & {
      group: string;
      version: string;
      kind: string;
    };
    /** The component to be rendered when the model matches */
    component: CodeRef<ComponentType<CreateResourceComponentProps>>;
  }
>;

// Type guards

export const isCreateResource = (e: Extension): e is CreateResource =>
  e.type === 'core.resource/create';

// Arbitrary types

/** Properties of custom CreateResource component. */
export type CreateResourceComponentProps = { namespace?: string };
