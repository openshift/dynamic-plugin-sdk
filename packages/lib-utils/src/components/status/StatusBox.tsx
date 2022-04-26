import { Alert, EmptyState, EmptyStateBody, Spinner, Text, Title } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import * as React from 'react';

export type LoadError = {
  /** Error message. */
  message: string;
  /** Error HTTP status code. */
  status: number;
};

type AccessDeniedProps = {
  /** Access denied message. */
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
  /** Optional flag indicating that external filters are applied. */
  areFiltersApplied?: boolean;
  /** Flag indicating that there is no data. */
  noData: boolean;
  /** Optional children component containing rendered data. */
  children?: React.ReactElement;
  /** Optional label used where there is no data. */
  emptyLabel?: string;
  /** Optional load error object. */
  loadError?: LoadError;
  /** Data loaded flag. */
  loaded?: boolean;
  /** Optional default message used when data loading fails. */
  LoadErrorDefaultMsg?: React.ComponentType;
  /** Optional message used when there is no data at all. */
  NoDataEmptyMsg?: React.ComponentType;
  /** Optional message used when there is no relevant data. */
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
