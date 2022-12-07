import { Grid, GridItem } from '@patternfly/react-core';
import React from 'react';
import type { ReactElement } from 'react';
import type { K8sResourceCommon } from '../../index';
import type { LoadError } from '../status';
import { StatusBox } from '../status';
import ResourceSummary from './ResourceSummary';

export type OverViewPageProps = {
  loaded?: boolean;
  loadError?: LoadError;
  resource: K8sResourceCommon;
  rightColumn?: ReactElement;
  additionalErrorDescription?: string;
};

const OverViewPage: React.FC<OverViewPageProps> = ({
  children,
  loaded,
  loadError,
  resource,
  rightColumn,
  additionalErrorDescription,
}) => {
  return (
    <Grid>
      <StatusBox
        loaded
        loadError={loadError}
        noData={false}
        emptyStateDescription={additionalErrorDescription}
      >
        <>
          <GridItem sm={6}>
            <ResourceSummary resource={resource} loaded={loaded}>
              {children}
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>{rightColumn}</GridItem>
        </>
      </StatusBox>
    </Grid>
  );
};

export default OverViewPage;
