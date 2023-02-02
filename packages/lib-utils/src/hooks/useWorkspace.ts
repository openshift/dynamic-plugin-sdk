import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import { useState } from 'react';
import { getActiveWorkspace, setActiveWorkspace } from '../k8s/k8s-utils';

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
  // All returns will be valid workspaces or null. Since there is no "default" workspace,
  // a null value means that one needs to be set. Returning a default or empty string will
  // break the model
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // get the activeWorkspace under that key if set, otherwise return null.
      return getActiveWorkspace();
    } catch (error) {
      consoleLogger.error(`Failed to get activeWorkspace due to: ${error}`);
      return null;
    }
  });

  const setActive = (ws: string) => {
    try {
      setWorkspace(ws);
      // Save to local storage using helper tools
      if (typeof window !== 'undefined') {
        setActiveWorkspace(ws);
      }
    } catch (error) {
      consoleLogger.error(`Failed to get activeWorkspace due to: ${error}`);
    }
  };

  return [workspace, setActive] as const;
};
