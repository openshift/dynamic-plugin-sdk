import * as React from 'react';
import { Spinner } from '@patternfly/react-core';

type WSLoadingStateProps = {
  socketBeingCreated: boolean;
  socketOpen: boolean;
  resourceLoaded: boolean;
};

const WSLoadingState: React.FC<WSLoadingStateProps> = ({ socketBeingCreated, socketOpen, resourceLoaded }) => {
  if (!socketBeingCreated) {
    return null;
  }
  if (socketOpen) {
    if (resourceLoaded) {
      return null;
    }

    return <p>Socket Open.</p>;
  }

  return <Spinner />;
};

export default WSLoadingState;
