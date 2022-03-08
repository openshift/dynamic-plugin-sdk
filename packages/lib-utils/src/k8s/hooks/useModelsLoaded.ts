import type { Map as ImmutableMap } from 'immutable';
import * as React from 'react';
import { useSelector } from 'react-redux';
import type { K8sModelCommon } from '../../types/k8s';
import type { SDKStoreState } from '../../types/redux';

export const useModelsLoaded = (): boolean => {
  const ref = React.useRef(false);
  const k8sModels = useSelector<SDKStoreState, ImmutableMap<string, K8sModelCommon[]>>(({ k8s }) =>
    k8s?.getIn(['RESOURCES', 'models']),
  );
  const inFlight = useSelector<SDKStoreState, boolean>(({ k8s }) =>
    k8s?.getIn(['RESOURCES', 'inFlight']),
  );

  if (!ref.current && k8sModels.size && !inFlight) {
    ref.current = true;
  }
  return ref.current;
};
