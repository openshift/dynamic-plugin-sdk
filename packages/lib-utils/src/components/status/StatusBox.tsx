import { Alert, EmptyState, EmptyStateBody, Spinner, Text, Title } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import * as React from 'react';

export type LoadError = {
  message: string;
  status: number;
};

type AccessDeniedProps = {
  message: string | React.ComponentType;
};

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = 'Insufficient access rights.',
}) => (
  <EmptyState>
    <Title headingLevel="h2">Restricted Access</Title>
    <EmptyStateBody>
      <Text>You don&apos;t have access to this section due to cluster policy.</Text>
      {message && (
        <Alert isInline variant="danger" title="Error details">
          {message}
        </Alert>
      )}
    </EmptyStateBody>
  </EmptyState>
);

export type StatusBoxProps = {
  areFiltersApplied?: boolean;
  noData: boolean;
  children?: React.ReactElement;
  emptyLabel?: string;
  loadError?: LoadError;
  loaded?: boolean;
  LoadErrorDefaultMsg?: React.ComponentType;
  NoDataEmptyMsg?: React.ComponentType;
  EmptyMsg?: React.ComponentType;
};

export const StatusBox: React.FC<StatusBoxProps> = ({
  areFiltersApplied,
  noData,
  children = null,
  loadError,
  emptyLabel,
  loaded,
  EmptyMsg,
  LoadErrorDefaultMsg,
  NoDataEmptyMsg,
}): React.ReactElement | null => {
  if (loadError) {
    const status = _.get(loadError, 'response.status');
    const loadErrorMsg = loadError.message || LoadErrorDefaultMsg || 'Data loading failed.';
    switch (status) {
      case 404:
        return (
          <EmptyState>
            <Title headingLevel="h1">404: Not Found</Title>
          </EmptyState>
        );
      case 403:
        return <AccessDenied message={loadErrorMsg} />;
      default:
        break;
    }

    return (
      <EmptyState>
        <Title headingLevel="h1">{emptyLabel}</Title>
        <EmptyStateBody>{loadErrorMsg}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!loaded) {
    return (
      <EmptyState>
        <Spinner />
      </EmptyState>
    );
  }

  if (noData) {
    if (!areFiltersApplied && NoDataEmptyMsg) {
      return <NoDataEmptyMsg />;
    }
    return EmptyMsg ? (
      <EmptyMsg />
    ) : (
      <EmptyState>
        <Text>{emptyLabel}</Text>
      </EmptyState>
    );
  }

  return children;
};
