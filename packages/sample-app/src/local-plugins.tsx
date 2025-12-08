import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import type {
  SampleAppExtensionWithText,
  SampleAppExtensionWithComponent,
} from './sample-extensions';

const fooManifest: LocalPluginManifest = {
  name: 'local-foo',
  version: '1.0.0',
  dependencies: { 'local-bar': '^1.0.0' },
  extensions: [
    {
      type: 'sample-app.text',
      properties: {
        text: 'Hello world',
      },
    } as SampleAppExtensionWithText,
  ],
  registrationMethod: 'local',
};

const barManifest: LocalPluginManifest = {
  name: 'local-bar',
  version: '1.1.0',
  extensions: [
    {
      type: 'sample-app.component',
      properties: {
        component: applyCodeRefSymbol(() =>
          Promise.resolve(() => <span>Fun fact: cats have supersonic hearing</span>),
        ),
      },
    } as SampleAppExtensionWithComponent,
  ],
  registrationMethod: 'local',
};

export const localPluginManifests = [fooManifest, barManifest];
