import type { ComponentType } from 'react';
import type { RouteComponentProps } from 'react-router';
import type { ExtensionK8sResourceIdentifier } from '../types/common';
import type { CodeRef, Extension } from '../types/extension';

/** Adds new page to host application's React router. */
export type RoutePage = Extension<'core.page/route', RoutePageProperties>;

/** Adds new resource list page to host application's React router. */
export type ResourceListPage = Extension<'core.page/resource/list', ResourcePageProperties>;

/** Adds new resource details page to host application's React router. */
export type ResourceDetailsPage = Extension<'core.page/resource/details', ResourcePageProperties>;

// Type guards

export const isRoutePage = (e: Extension): e is RoutePage => e.type === 'core.page/route';
export const isResourceListPage = (e: Extension): e is ResourceListPage =>
  e.type === 'core.page/resource/list';
export const isResourceDetailsPage = (e: Extension): e is ResourceDetailsPage =>
  e.type === 'core/Resource/details';

// Arbitrary types

export type RoutePageProperties = {
  /** The perspective to which this page belongs to. If not specified, contributes to all perspectives. */
  perspective?: string;
  /** The component to be rendered when the route matches. */
  component: CodeRef<ComponentType<RouteComponentProps>>;
  /** Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. */
  path: string | string[];
  /** When true, will only match if the path matches the `location.pathname` exactly. */
  exact?: boolean;
  /** Option to add custom className to wrapper component */
  className?: string;
};

export type ResourcePageProperties = {
  /** The model for which this resource page links to. */
  model: ExtensionK8sResourceIdentifier & {
    group: string;
    kind: string;
  };
  /** The component to be rendered when the route matches. */
  component: CodeRef<
    ComponentType<{
      match: RouteComponentProps['match'];
      /** The namespace for which this resource page links to. */
      namespace: string;
      /** The model for which this resource page links to. */
      model: ExtensionK8sResourceIdentifier & {
        group: string;
        version: string;
        kind: string;
      };
    }>
  >;
};
