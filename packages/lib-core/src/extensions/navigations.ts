import type { ExtensionK8sResourceIdentifier } from '../types/common';
import type { Extension } from '../types/extension';

export type NavItem = Extension<
  'core.navigation/href',
  NavItemProperties & {
    name: string;
  }
>;

export type HrefNavItem = Extension<
  'core.navigation/href',
  NavItemProperties & {
    /** The name of this item. */
    name: string;
    /** The link href value. */
    href: string;
    /** if true, adds /ns/active-namespace to the end */
    namespaced?: boolean;
    /** if true, adds /k8s/ns/active-namespace to the begining */
    prefixNamespaced?: boolean;
    /** if true, app should open new tab with the href */
    isExternal?: boolean;
  }
>;

export type ResourceNSNavItem = Extension<
  'core.navigation/resource-ns',
  NavItemProperties & {
    /** The model for which this nav item links to. */
    model: ExtensionK8sResourceIdentifier & {
      group: string;
      version: string;
      kind: string;
    };
  }
>;

export type Separator = Extension<
  'core.navigation/separator',
  Omit<NavItemProperties, 'startsWith'>
>;

export type NavSection = Extension<
  'core.navigation/section',
  Omit<NavItemProperties, 'startsWith' | 'section'> & {
    /** Name of this section. If not supplied, only a separator will be shown above the section. */
    name?: string;
  }
>;

// Type guards

export const isHrefNavItem = (e: Extension): e is HrefNavItem => e.type === 'core.navigation/href';
export const isResourceNSNavItem = (e: Extension): e is ResourceNSNavItem =>
  e.type === 'core.navigation/resource-ns';
export const isSeparator = (e: Extension): e is Separator => e.type === 'core.navigation/separator';
export const isNavSection = (e: Extension): e is NavSection => e.type === 'core.navigation/section';

// Arbitrary types

export type NavItemProperties = {
  /** A unique identifier for this item. */
  id: string;
  /** The name of this item. If not supplied the name of the link will equal the plural value of the model. */
  name?: string;
  /** The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. */
  perspective?: string;
  /** Navigation section to which this item belongs to. If not specified, render this item as a top level link. */
  section?: string;
  /** Adds data attributes to the DOM. */
  dataAttributes?: { [key: string]: string };
  /** Mark this item as active when the URL starts with one of these paths. */
  startsWith?: string[];
  /** Insert this item before the item referenced here. For arrays, the first one found in order is used. */
  insertBefore?: string | string[];
  /** Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. */
  insertAfter?: string | string[];
};
