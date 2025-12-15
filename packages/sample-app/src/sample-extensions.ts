import type { CodeRef, Extension } from '@openshift/dynamic-plugin-sdk';
import type { ComponentType } from 'react';

export type SampleAppExtensionWithText = Extension<
  'sample-app.text',
  {
    text: string;
  }
>;

export type SampleAppExtensionWithComponent = Extension<
  'sample-app.component',
  {
    component: CodeRef<ComponentType>;
  }
>;

export const isSampleAppExtensionWithText = (e: Extension): e is SampleAppExtensionWithText =>
  e.type === 'sample-app.text';

export const isSampleAppExtensionWithComponent = (
  e: Extension,
): e is SampleAppExtensionWithComponent => e.type === 'sample-app.component';
