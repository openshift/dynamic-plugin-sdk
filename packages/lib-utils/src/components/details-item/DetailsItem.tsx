import { Grid, GridItem, Label, Flex, FlexItem } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import * as React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import './details-item.css';

export type DetailsItemProps = {
  /** Optional default value for the item */
  defaultValue?: React.ReactNode;
  /** Optional flag to hide detail item if the value is empty */
  hideEmpty?: boolean;
  /** Optional flag to place the detail item's title and value horizontally */
  split?: boolean;
  /** Title for the detail item */
  title: string;
  /** Optional label to be displayed alongside the title */
  titleLabel?: {
    name: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  };
  /** K8s resource that the detail item belongs to */
  obj: K8sResourceCommon;
  /** Optional path to the relevant attribute in the K8s resource */
  path?: string | string[];
};

export const DetailsItem: React.FC<DetailsItemProps> = ({
  defaultValue = '-',
  hideEmpty,
  split,
  title,
  titleLabel,
  obj,
  path,
  children,
}) => {
  const hide = hideEmpty && path && _.isEmpty(_.get(obj, path));
  const value: React.ReactNode = children || (path && _.get(obj, path, defaultValue));
  const titleSpan = split ? 2 : 12;
  const detailSpan = split ? 10 : 12;
  const defaultLabelColor = 'purple';

  return hide ? null : (
    <Grid hasGutter>
      <GridItem span={titleSpan}>
        <Flex>
          <FlexItem>
            <p className="details-item__title" data-test-selector={`details-item-title__${title}`}>
              {title}
            </p>
          </FlexItem>
          {!split && titleLabel?.name && (
            <FlexItem>
              <Label icon={titleLabel.icon} color={titleLabel.color ?? defaultLabelColor}>
                {titleLabel.name}
              </Label>
            </FlexItem>
          )}
        </Flex>
      </GridItem>
      <GridItem span={detailSpan} data-test-selector={`details-item-value__${title}`}>
        {value}
      </GridItem>
    </Grid>
  );
};

export default DetailsItem;
