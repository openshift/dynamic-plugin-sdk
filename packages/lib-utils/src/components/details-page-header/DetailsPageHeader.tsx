import {
  Split,
  SplitItem,
  TextContent,
  Text,
  TextVariants,
  Label,
  DropdownPosition,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import type { BreadcrumbProp, ActionButtonProp, ActionMenuProps } from './utils';
import { Breadcrumbs, ActionButtons, ActionMenu } from './utils';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';

export type DetailsPageHeaderProps = {
  breadcrumbs: BreadcrumbProp[];
  actionButtons?: ActionButtonProp[];
  pageHeading?: string;
  obj?: K8sResourceCommon;
  pageHeadingLabel?: {
    name: string;
    key?: string;
    icon?: React.ReactNode;
    href?: string;
    color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  };
  actionMenu?: ActionMenuProps;
};

export const DetailsPageHeader: React.SFC<DetailsPageHeaderProps> = ({
  breadcrumbs,
  actionButtons,
  actionMenu,
  pageHeading,
  obj,
  pageHeadingLabel,
}) => {
  const heading = pageHeading ?? obj?.metadata?.name;
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
        {/* Details page heading */}
        {heading && (
          <SplitItem>
            <TextContent>
              <Text component={TextVariants.h1}>{heading}</Text>
            </TextContent>
          </SplitItem>
        )}
        {/* Optional details page heading label */}
        {!_.isEmpty(pageHeadingLabel) && (
          <SplitItem>
            <Label
              href={pageHeadingLabel?.href}
              icon={pageHeadingLabel?.icon}
              color={pageHeadingLabel?.color}
              key={pageHeadingLabel?.key ?? pageHeadingLabel?.name}
            >
              {pageHeadingLabel?.name}
            </Label>
          </SplitItem>
        )}
        <SplitItem isFilled />
        {/* Optional action buttons */}
        {!_.isEmpty(actionButtons) && Array.isArray(actionButtons) && (
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
