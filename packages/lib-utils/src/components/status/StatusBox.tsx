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
  /** Optional flag indicating that filters are applied to data */
  areFiltersApplied?: boolean;
  /** Flag indicating that no data exist */
  noData: boolean;
  /** Optional children element to be rendered */
  children?: React.ReactElement;
  /** Optional empty state description string */
  emptyStateDescription?: string;
  /** Optional load error object */
  loadError?: LoadError;
  /** Optional flag indicating that data has been loaded */
  loaded?: boolean;
  /** Load error default message */
  loadErrorDefaultText?: string;
  /** Custom empty state when no data exist */
  CustomNoDataEmptyState?: React.ComponentType;
  /** Custom empty state when there are no applicable data */
  CustomEmptyState?: React.ComponentType;
};

export const StatusBox: React.FC<StatusBoxProps> = ({
  areFiltersApplied,
  noData,
  children = null,
  loadError,
  emptyStateDescription,
  loaded,
  CustomEmptyState,
  loadErrorDefaultText,
  CustomNoDataEmptyState,
}): React.ReactElement | null => {
  if (loadError) {
    const status = _.get(loadError, 'response.status');
    const loadErrorMsg = loadError.message || loadErrorDefaultText || 'Data loading failed.';
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
        <Title headingLevel="h1">{loadErrorMsg}</Title>
        <EmptyStateBody>{emptyStateDescription}</EmptyStateBody>
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
    if (!areFiltersApplied && CustomNoDataEmptyState) {
      return <CustomNoDataEmptyState />;
    }
    return CustomEmptyState ? (
      <CustomEmptyState />
    ) : (
      <EmptyState>
        <Text>{emptyStateDescription}</Text>
      </EmptyState>
    );
  }

  return children;
};
