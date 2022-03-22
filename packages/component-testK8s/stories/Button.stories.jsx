import React from 'react';
import { setUtilsConfig, getUtilsConfig, commonFetch  } from '@openshift/dynamic-plugin-sdk-utils';
import '@patternfly/react-core/dist/styles/base.css';

import TestK8s from '../src/TestK8s';

const setUtilsConfigOnce = () => {
  try {
    const utilsConfig = getUtilsConfig();
    if (utilsConfig) {
      return;
    }
  } catch (e) {
    // no-op
  }
  // TODO this isn't sufficient
  setUtilsConfig({
    appFetch: commonFetch,
    wsAppSettings: {}
  });
};

export default {
  title: 'TestK8s',
  component: TestK8s,
};

const Template = (args) => <TestK8s {...args} />;

export const UtilsConfigLoaded = Template.bind({});
UtilsConfigLoaded.loaders = [
  () => setUtilsConfigOnce()
];
