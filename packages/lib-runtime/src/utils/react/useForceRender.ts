import * as React from 'react';

/**
 * React hook that enqueues a re-render of the component.
 */
export const useForceRender = (): VoidFunction => React.useReducer((s: boolean) => !s, false)[1];
