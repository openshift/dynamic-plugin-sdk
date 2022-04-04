import * as React from 'react';
import type { AnyObject } from '../../types';
import ErrorBoundaryFallback from './ErrorBoundaryFallback';

export type ErrorBoundaryFallbackProps = {
  error: Error;
  errorInfo: React.ErrorInfo;
};

type ErrorBoundaryProps = AnyObject;

type ErrorBoundaryState = {
  hasError: boolean;
} & Partial<ErrorBoundaryFallbackProps>;

/**
 * @see https://reactjs.org/docs/error-boundaries.html
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });

    // eslint-disable-next-line no-console
    console.error('Error in a child component', error);
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children } = this.props;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return hasError ? <ErrorBoundaryFallback error={error!} errorInfo={errorInfo!} /> : children;
  }
}

export default ErrorBoundary;
