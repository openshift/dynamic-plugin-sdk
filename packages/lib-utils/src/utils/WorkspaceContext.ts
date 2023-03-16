import { createContext } from 'react';
import type { workspaceState } from './workspaceState';

/**
 *
 * The WorkspaceContext is a context for the `workspaceState`. It is used to access the methods
 * and data used to implement an `activeWorkspace`.
 *
 * @example
 * ``` ts
 * const { subscribe, unsubscribe, getState, setWorkspaceContext } = useContext(WorkspaceContext);
 * ```
 */
const WorkspaceContext = createContext<ReturnType<typeof workspaceState>>({
  update: () => undefined,
  setWorkspaceContext: () => undefined,
  subscribe: () => '',
  unsubscribe: () => undefined,
  getState: () => ({
    subscribtions: {},
    activeWorkspace: null,
  }),
});

export default WorkspaceContext;
