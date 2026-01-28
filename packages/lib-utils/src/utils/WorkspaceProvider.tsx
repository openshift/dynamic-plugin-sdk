import type { PropsWithChildren, FC } from 'react';
import { useMemo } from 'react';
import WorkspaceContext from './WorkspaceContext';
import { workspaceState } from './workspaceState';

/**
 * Context for passing through the activeWorkspace. The context provides the active value
 * to the `useWorkspace` hook. This context maintains the state of the activeWorkspace while 
 * providing a publish/subscribe model to refresh the kubernetes watches on a workspace change.
 * 
 * @returns A full context with the activeWorkspace's state and internal update methods
 * 
 * @example 
 * ``` ts
 *  <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
 * ```
 */
const WorkspaceProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const state = useMemo(() => workspaceState(), []);
  return <WorkspaceContext.Provider value={state}>{children}</WorkspaceContext.Provider>;
};

export default WorkspaceProvider;
