import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk';
import type { ModelFeatureFlag, TelemetryListener } from '@openshift/dynamic-plugin-sdk-extensions';

// TODO(vojtech): make EncodedExtension type work with A | B type unions

const e1: EncodedExtension<ModelFeatureFlag> = {
  type: 'core.flag/model',
  properties: {
    flag: 'EXAMPLE',
    model: {
      group: 'example.org',
      version: 'v1',
      kind: 'ExampleModel',
    },
  },
};

const e2: EncodedExtension<TelemetryListener> = {
  type: 'core.telemetry/listener',
  properties: {
    listener: { $codeRef: 'telemetryListener' },
  },
  flags: {
    required: ['TELEMETRY_FLAG'],
    disallowed: [],
  },
};

export default [e1, e2];
