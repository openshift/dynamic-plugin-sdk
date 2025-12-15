import type {
  SampleAppExtensionWithText,
  SampleAppExtensionWithComponent,
} from '@monorepo/sample-app/src/sample-extensions';
import type { EncodedExtension } from '@openshift/dynamic-plugin-sdk';

type ConsumedExtension =
  | EncodedExtension<SampleAppExtensionWithText>
  | EncodedExtension<SampleAppExtensionWithComponent>;

const extensions: ConsumedExtension[] = [
  {
    type: 'sample-app.text',
    properties: {
      text: 'Plasma reactors online',
    },
  },
  {
    type: 'sample-app.component',
    properties: {
      component: { $codeRef: 'testComponent' },
    },
    flags: {
      required: ['SAMPLE_FLAG'],
    },
  },
];

export default extensions;
