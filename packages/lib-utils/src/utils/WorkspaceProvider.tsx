import React from 'react';
import WorkspaceContext from './WorkspaceContext';
import { workspaceState } from './workspaceState';

const WorkspaceProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const state = React.useMemo(() => workspaceState(), []);
  return <WorkspaceContext.Provider value={state}>{children}</WorkspaceContext.Provider>;
};

export default WorkspaceProvider;
