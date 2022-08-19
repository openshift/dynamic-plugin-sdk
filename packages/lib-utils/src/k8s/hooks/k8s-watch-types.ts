import type { K8sModelCommon, Selector } from '../../types/k8s';
import type { ThunkDispatchFunction } from '../../types/redux';
import type { WebSocketOptions } from '../../web-socket/types';
import type { WatchK8sResource } from './watch-resource-types';

export type WatchData = { id: string; action: ThunkDispatchFunction };

export type GetWatchData = (
  resource?: WatchK8sResource,
  k8sModel?: K8sModelCommon,
  options?: Partial<WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
) => WatchData | null;

export type Query = { [key: string]: unknown };

export type MakeQuery = (
  namespace?: string,
  labelSelector?: Selector,
  fieldSelector?: string,
  name?: string,
  limit?: number,
) => Query;
