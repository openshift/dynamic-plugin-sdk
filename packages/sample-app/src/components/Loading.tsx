import { Bullseye, Spinner } from '@patternfly/react-core';
import type { FC } from 'react';

const Loading: FC = () => (
  <Bullseye>
    <Spinner />
  </Bullseye>
);

export default Loading;
