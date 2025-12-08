import type {
  SampleAppExtensionWithText,
  SampleAppExtensionWithComponent,
} from '@monorepo/sample-app/src/sample-extensions';
import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk';

// TODO(vojtech): make EncodedExtension<T> type param work with A | B unions

const extensions: EncodedExtension[] = [];

extensions.push({
  type: 'sample-app.text',
  properties: {
    text: 'Plasma reactors online',
  },
} as EncodedExtension<SampleAppExtensionWithText>);

extensions.push({
  type: 'sample-app.component',
  properties: {
    component: { $codeRef: 'testComponent' },
  },
  flags: {
    required: ['SAMPLE_FLAG'],
  },
} as EncodedExtension<SampleAppExtensionWithComponent>);

export default extensions;
