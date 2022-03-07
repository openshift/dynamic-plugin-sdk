import type { K8sModelCommon, Selector } from '../../types/k8s';
import type { ThunkDispatchFunction } from '../../types/redux';
import type { WatchK8sResource } from './watch-resource-types';

export type GetIDAndDispatch = (
  resource?: WatchK8sResource,
  k8sModel?: K8sModelCommon,
  cluster?: string,
) => { id: string; dispatch: ThunkDispatchFunction } | null;

export type Query = { [key: string]: unknown };

export type MakeQuery = (
  namespace?: string,
  labelSelector?: Selector,
  fieldSelector?: string,
  name?: string,
  limit?: number,
) => Query;
