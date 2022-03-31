import type {
  EncodedExtension,
  ModelFeatureFlag,
  TelemetryListener,
} from '@openshift/dynamic-plugin-sdk';

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
};

export default [e1, e2];
