import { v4 as uuidv4 } from 'uuid';

const WORKSPACE_KEY = 'sdk/active-workspace';
export type WorkspaceContextState = {
  activeWorkspace: string | null;
};

export enum UpdateEvents {
  activeWorkspace = 'activeWorkspace',
}

export const workspaceState = () => {
  let state: WorkspaceContextState = {
    activeWorkspace: localStorage.getItem(WORKSPACE_KEY),
  };

  // registry of all subscribers (hooks)
  const subscriptions: {
    [key in UpdateEvents]: {
      [id: string]: () => void;
    };
  } = {
    activeWorkspace: {},
  };

  // add subscriber (hook) to registry
  function subscribe(event: UpdateEvents, onUpdate: () => void) {
    const id = uuidv4();
    // const id = `${Date.now()}${Math.random()}`;
    subscriptions[event][id] = onUpdate;
    // trigger initial update to get the initial data
    onUpdate();
    return id;
  }

  // remove subscriber from registry
  function unsubscribe(id: string, event: UpdateEvents) {
    delete subscriptions[event][id];
  }

  // update state attribute and push data to subscribers
  function update(event: UpdateEvents, attributes: Partial<WorkspaceContextState>) {
    state = {
      ...state,
      ...attributes,
    };
    const updateSubscriptions = Object.values(subscriptions[event]);
    if (updateSubscriptions.length === 0) {
      return;
    }

    // update the subscribed clients
    updateSubscriptions.forEach((onUpdate) => {
      onUpdate();
    });
  }

  function setWorkspaceContext(workspace: string | null) {
    update(UpdateEvents.activeWorkspace, { activeWorkspace: workspace });
  }

  function getState() {
    return state;
  }

  // public state manager interface
  return {
    getState,
    setWorkspaceContext,
    subscribe,
    unsubscribe,
    update,
  };
};

export default workspaceState;
