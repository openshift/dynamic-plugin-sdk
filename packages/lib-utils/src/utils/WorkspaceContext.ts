import { createContext } from 'react';
import type { workspaceState } from './workspaceState';

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
