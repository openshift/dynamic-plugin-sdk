import type { AnyObject } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import ErrorBoundaryFallback from './ErrorBoundaryFallback';

export type ErrorBoundaryFallbackProps = {
  error: Error;
  errorInfo: React.ErrorInfo;
};

type ErrorBoundaryProps = React.PropsWithChildren<AnyObject>;

type ErrorBoundaryState =
  | {
      hasError: false;
    }
  | ({
      hasError: true;
    } & ErrorBoundaryFallbackProps);

/**
 * @see https://reactjs.org/docs/error-boundaries.html
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });

    // eslint-disable-next-line no-console
    console.error('Error in a child component', error);
  }

  override render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (!hasError) {
      return children;
    }

    const { error, errorInfo } = this.state;
    return <ErrorBoundaryFallback error={error} errorInfo={errorInfo} />;
  }
}

export default ErrorBoundary;
