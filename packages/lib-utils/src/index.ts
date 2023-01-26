/**
 * Kubernetes and other dynamic plugin SDK utilities.
 *
 * @remarks
 * This package provides various React focused dynamic plugin SDK utilities,
 * including APIs for working with Kubernetes and integrating with Redux.
 *
 * @packageDocumentation
 */

// Kubernetes utilities
export { default as AppInitSDK, AppInitSDKProps } from './app/AppInitSDK';
export { UtilsConfig, isUtilsConfigSet, setUtilsConfig, getUtilsConfig } from './config';
export { commonFetch, commonFetchText, commonFetchJSON } from './utils/common-fetch';
export {
  k8sGetResource,
  k8sCreateResource,
  k8sUpdateResource,
  k8sPatchResource,
  k8sDeleteResource,
  k8sListResource,
  k8sListResourceItems,
  K8sResourceBaseOptions,
  K8sResourceReadOptions,
  K8sResourceUpdateOptions,
  K8sResourcePatchOptions,
  K8sResourceDeleteOptions,
  K8sResourceListOptions,
  K8sResourceListResult,
} from './k8s/k8s-resource';
export { getK8sResourceURL } from './k8s/k8s-utils';
export { createAPIActions, initAPIDiscovery } from './app/api-discovery';
export { InitAPIDiscovery, DiscoveryResources, APIActions } from './types/api-discovery';
export {
  K8sModelCommon,
  K8sResourceCommon,
  K8sGroupVersionKind,
  K8sResourceIdentifier,
  K8sResourceKindReference,
  K8sVerb,
  GetGroupVersionKindForModel,
  GroupVersionKind,
  QueryOptions,
  QueryParams,
  Patch,
  Operator,
  OwnerReference,
  MatchExpression,
  MatchLabels,
  Selector,
  FilterValue,
} from './types/k8s';

// WebSocket utilities
export { WebSocketFactory, WebSocketState } from './web-socket/WebSocketFactory';
export {
  BulkMessageHandler,
  CloseHandler,
  DestroyHandler,
  ErrorHandler,
  GenericHandler,
  MessageHandler,
  MessageDataType,
  OpenHandler,
  WebSocketAppSettings,
  WebSocketOptions,
} from './web-socket/types';

// Redux utilities
export { SDKReducers } from './app/redux/reducers';
export { ActionType } from './app/redux/actions/k8s';
export { default as ReduxExtensionProvider } from './app/redux/ReduxExtensionProvider';
export { K8sState } from './types/redux';

// React hooks
export { useK8sWatchResource, useK8sWatchResources, useK8sModel, useK8sModels } from './k8s/hooks';
export { UseK8sModel, UseK8sModels } from './k8s/hooks/use-model-types';
export { Query } from './k8s/hooks/k8s-watch-types';
export {
  WatchK8sResource,
  WatchK8sResources,
  ResourcesObject,
  WatchK8sResult,
  WatchK8sResults,
  WatchK8sResultsObject,
} from './k8s/hooks/watch-resource-types';

// React components
export { ListView, FilterItem, ListViewProps } from './components/list-view';
export { GettingStartedCard, GettingStartedCardProps } from './components/getting-started-card';
export {
  Tab,
  HorizontalNav,
  HorizontalNavTabs,
  HorizontalNavProps,
  WithRouterProps,
} from './components/horizontal-nav';
export { LabelList, LabelListProps, HrefForLabels } from './components/label-list';
export {
  Td,
  TableColumn,
  RowProps,
  TablePagination,
  VirtualizedTableProps,
} from './components/table';
export { LoadError } from './components/status';
export {
  DetailsItem,
  DetailsItemList,
  DetailsItemProps,
  OverviewPage,
  OverViewPageProps,
  ResourceSummary,
  ResourceSummaryProps,
} from './components/resource-summary';
export { DetailsPage, DetailsPageProps } from './components/details-page';
export {
  Action,
  ActionButtonProp,
  ActionCTA,
  ActionMenuOptions,
  ActionMenuProps,
  ActionMenuVariant,
  BreadcrumbProp,
  DetailsPageHeaderProps,
  GroupedActions,
  PageHeading,
} from './components/details-page-header';
