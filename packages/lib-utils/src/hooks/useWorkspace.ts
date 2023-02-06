import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import { useContext, useEffect, useReducer } from 'react';
import { setActiveWorkspaceLocalStorage } from '../k8s/k8s-utils';
import WorkspaceContext from '../utils/WorkspaceContext';
import { UpdateEvents } from '../utils/workspaceState';

/**
 * Hook that retrieves the active workspace from localStorage. The key for the active workspace is
 * always `sdk/active-workspace`
 * @returns a value for the activeWorkspace (string | null ) and a setter for updating the active workspace
 *
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const [activeWorkspace, setActiveWorkspace] = useWorkspace();
 *
 *   setActiveWorkspace("openshift-dev");
 *   return ...
 * }
 * ```
 */
export const useWorkspace = () => {
  const { subscribe, unsubscribe, getState, setWorkspaceContext } = useContext(WorkspaceContext);
  // There isn't any other way around this for now, but this is an active anti-pattern. We need to reRender the page to
  // get the websocket to watch the new workspace on change. This is considered tech-debt and is actively discouraged.
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
  const [, forceRender] = useReducer((count) => count + 1, 0);

  // All returns will be valid workspaces or null. Since there is no "default" workspace,
  // a null value means that one needs to be set. Returning a default or empty string will
  // break the model
  const workspace = getState().activeWorkspace;

  const setActive = (newWorkspace: string) => {
    try {
      if (typeof window !== 'undefined') {
        setActiveWorkspaceLocalStorage(newWorkspace);
        setWorkspaceContext(newWorkspace);
      }
    } catch (error) {
      consoleLogger.error(`Failed to get activeWorkspace due to: ${error}`);
    }
  };

  useEffect(() => {
    const subsId = subscribe(UpdateEvents.activeWorkspace, forceRender);
    return () => {
      unsubscribe(subsId, UpdateEvents.activeWorkspace);
    };
  }, [subscribe, unsubscribe]);

  return [workspace, setActive] as const;
};
