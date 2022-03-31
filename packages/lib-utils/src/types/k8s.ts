export type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';

export type K8sResourceIdentifier = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
};

export type K8sModelCommon = K8sResourceIdentifier & {
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';
  verbs?: K8sVerb[];
  shortNames?: string[];
  crd?: boolean;
  namespaced?: boolean;
};

export type K8sResourceCommon = K8sResourceIdentifier &
  Partial<{
    metadata: Partial<{
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
    spec: {
      selector?: Selector | MatchLabels;
      [key: string]: unknown;
    };
    status: { [key: string]: unknown };
    data: { [key: string]: unknown };
  }>;

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

export enum Operator {
  Exists = 'Exists',
  DoesNotExist = 'DoesNotExist',
  In = 'In',
  NotIn = 'NotIn',
  Equals = 'Equals',
  NotEqual = 'NotEqual',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  NotEquals = 'NotEquals',
}

export type MatchExpression = {
  key: string;
  operator: Operator | string;
  values?: string[];
  value?: string;
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = Partial<{
  matchLabels: MatchLabels;
  matchExpressions: MatchExpression[];
  [key: string]: unknown;
}>;

export type FilterValue = Partial<{
  selected: string[];
  all: string[];
}>;

export type GetGroupVersionKindForModel = (model: K8sModelCommon) => K8sResourceIdentifier;

export type K8sGroupVersionKind = { group?: string; version: string; kind: string };

/**
 * @deprecated Use K8sResourceIdentifier type instead. Support for type GroupVersionKind will be removed in a future release.
 * @see K8sResourceIdentifier
 * GroupVersionKind unambiguously identifies a kind.
 * https://godoc.org/k8s.io/apimachinery/pkg/runtime/schema#GroupVersionKind
 * TODO: Change this to a regex-type if it ever becomes a thing (https://github.com/Microsoft/TypeScript/issues/6579)
 */
export type GroupVersionKind = string;

/**
 * @deprecated Use GetGroupVersionKindForModel type instead. Support for type K8sResourceKindReference will be removed in a future release.
 * @see GetGroupVersionKindForModel
 * The canonical, unique identifier for a Kubernetes resource type.
 * Maintains backwards-compatibility with references using the `kind` string field.
 */
export type K8sResourceKindReference = GroupVersionKind | string;
