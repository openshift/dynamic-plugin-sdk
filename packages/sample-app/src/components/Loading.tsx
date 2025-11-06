import { Bullseye, Spinner } from '@patternfly/react-core';
import * as React from 'react';

const Loading: React.FC = () => (
  <Bullseye>
    <Spinner />
  </Bullseye>
);

export default Loading;
