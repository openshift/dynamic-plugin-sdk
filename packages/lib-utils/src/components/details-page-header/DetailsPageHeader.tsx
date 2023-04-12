import {
  Split,
  SplitItem,
  TextContent,
  Text,
  TextVariants,
  Label,
  DropdownPosition,
} from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import type { BreadcrumbProp, ActionButtonProp, ActionMenuProps } from './utils';
import { Breadcrumbs, ActionButtons, ActionMenu } from './utils';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';

export type PageHeading = {
  /** Optional title for page heading */
  title?: string;
  /** Optional label for page heading */
  label?: {
    name: string;
    key?: string;
    icon?: React.ReactNode;
    href?: string;
    color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  };
  /** Optional icon for page heading (appears to the left of the page heading's title) */
  iconBeforeTitle?: React.ReactNode;
  /** Optional icon for page heading (appears to the right of the page heading's title) */
  iconAfterTitle?: React.ReactNode;
};

export type DetailsPageHeaderProps = {
  breadcrumbs: BreadcrumbProp[];
  actionButtons?: ActionButtonProp[];
  pageHeading?: PageHeading;
  /** Optional resource object (if no title for the page heading is provided, the title can be taken from the resource's name) */
  obj?: K8sResourceCommon;
  actionMenu?: ActionMenuProps;
};

export const DetailsPageHeader: React.SFC<DetailsPageHeaderProps> = ({
  breadcrumbs,
  actionButtons,
  actionMenu,
  pageHeading,
  obj,
}) => {
  const heading = pageHeading?.title ?? obj?.metadata?.name;
  return (
    <>
      <Split hasGutter className="pf-u-mb-sm">
        {/* Breadcrumbs */}
        <SplitItem>
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </SplitItem>
        <SplitItem isFilled />
      </Split>
      <Split hasGutter className="pf-u-mb-sm pf-u-mr-sm">
        {/** Icon for details page heading (before title) */}
        {pageHeading && !isEmpty(pageHeading?.iconBeforeTitle) && (
          <SplitItem className="pf-u-mt-auto pf-u-mb-auto">
            {pageHeading?.iconBeforeTitle}
          </SplitItem>
        )}
        {/* Details page heading */}
        {heading && (
          <SplitItem>
            <TextContent>
              <Text component={TextVariants.h1}>{heading}</Text>
            </TextContent>
          </SplitItem>
        )}
        {/** Icon for details page heading (after title) */}
        {pageHeading && !isEmpty(pageHeading?.iconAfterTitle) && (
          <SplitItem className="pf-u-mt-auto pf-u-mb-auto">{pageHeading?.iconAfterTitle}</SplitItem>
        )}
        {/* Optional details page heading label */}
        {!isEmpty(pageHeading) && !isEmpty(pageHeading?.label) && (
          <SplitItem>
            <Label
              href={pageHeading?.label?.href}
              icon={pageHeading?.label?.icon}
              color={pageHeading?.label?.color}
              key={pageHeading?.label?.key ?? pageHeading?.label?.name}
            >
              {pageHeading?.label?.name}
            </Label>
          </SplitItem>
        )}
        <SplitItem isFilled />
        {/* Optional action buttons */}
        {!isEmpty(actionButtons) && Array.isArray(actionButtons) && (
          <SplitItem>
            <ActionButtons actionButtons={actionButtons} />
          </SplitItem>
        )}
        {/* Optional action menu - ungrouped actions */}
        {actionMenu && Array.isArray(actionMenu?.actions) && (
          <SplitItem>
            <ActionMenu
              actions={actionMenu?.actions}
              isDisabled={actionMenu?.isDisabled}
              variant={actionMenu?.variant}
              label={actionMenu?.label}
              position={DropdownPosition.right}
            />
          </SplitItem>
        )}
        {/* Optional action menu - Grouped actions */}
        {actionMenu && Array.isArray(actionMenu?.groupedActions) && (
          <SplitItem>
            <ActionMenu
              groupedActions={actionMenu?.groupedActions}
              isDisabled={actionMenu?.isDisabled}
              variant={actionMenu?.variant}
              label={actionMenu?.label}
              position={DropdownPosition.right}
            />
          </SplitItem>
        )}
      </Split>
    </>
  );
};

export default DetailsPageHeader;
