import { pluralizeKind, updateResources } from '../../app/api-discovery';
import type { K8sModelCommon, K8sResourceIdentifier } from '../../types/k8s';
import type { DispatchWithThunk } from '../../types/redux';
import { getK8sAPIPath, getK8sResourceIdentifier } from '../k8s-utils';
import type { WatchK8sResource } from './watch-resource-types';

export const fetchModel = (resource: WatchK8sResource, dispatch: DispatchWithThunk) => {
  const identifier: K8sResourceIdentifier = getK8sResourceIdentifier(
    resource.groupVersionKind || resource.kind,
  );
  const model: K8sModelCommon = {
    plural: pluralizeKind(identifier.kind),
    ...identifier,
  };
  dispatch(updateResources([getK8sAPIPath(model)], true));
};
