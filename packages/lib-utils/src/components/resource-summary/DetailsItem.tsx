import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
} from '@patternfly/react-core';
import * as _ from 'lodash-es';

import React from 'react';

import type { K8sResourceCommon } from '../../index';

type DetailsItemProps = {
  defaultValue?: string;
  hideEmpty?: boolean;
  loaded?: boolean;
  label: string;
  resource?: K8sResourceCommon;
  path?: string | string[];
};

const DetailsItem: React.FC<DetailsItemProps> = ({
  children,
  defaultValue = '-',
  hideEmpty,
  loaded = true,
  label,
  resource,
  path = '',
}) => {
  const objValue = _.get(resource, path);

  if (hideEmpty && objValue === undefined && !children) {
    return null;
  }

  const value: React.ReactNode = children || objValue || defaultValue;

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDescription>
        {!loaded ? <Skeleton screenreaderText={`Loading ${label}`} width="75%" /> : value}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default DetailsItem;
