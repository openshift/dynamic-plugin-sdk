type K8sResourceIdentifier = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
};

export type K8sModelCommon = K8sResourceIdentifier & {
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';
};

export type K8sResourceCommon = K8sResourceIdentifier & {
  metadata?: Partial<{
    annotations: Record<string, string>;
    clusterName: string;
    creationTimestamp: string;
    deletionGracePeriodSeconds: number;
    deletionTimestamp: string;
    finalizers: string[];
    generateName: string;
    generation: number;
    labels: Record<string, string>;
    managedFields: unknown[];
    name: string;
    namespace: string;
    ownerReferences: OwnerReference[];
    resourceVersion: string;
    uid: string;
  }>;
};

type OwnerReference = {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
};

export type QueryOptions = Partial<{
  ns: string;
  name: string;
  path: string;
  queryParams: QueryParams;
}>;

export type QueryParams = Partial<{
  watch: string;
  labelSelector: string;
  fieldSelector: string;
  resourceVersion: string;
  [key: string]: string;
}>;

export type Patch = {
  op: string;
  path: string;
  value?: unknown;
};
