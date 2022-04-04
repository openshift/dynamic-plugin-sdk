import {
  Flex,
  FlexItem,
  Text,
  TextContent,
  CodeBlock,
  CodeBlockCode,
} from '@patternfly/react-core';
import * as React from 'react';
import type { ErrorBoundaryFallbackProps } from './ErrorBoundary';

import './ErrorBoundaryFallback.css';

const trimEmptyLines = (text: string) => text.replace(/^\s*\n/gm, '');

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, errorInfo }) => (
  <Flex className="app-error-boundary-fallback" direction={{ default: 'column' }}>
    <FlexItem>
      <TextContent>
        <Text component="h1">Oh no! Something went wrong.</Text>
        <Text component="h2">{error.name}</Text>
        <Text component="p">Error message: {error.message || '(empty)'}</Text>
      </TextContent>
    </FlexItem>
    <FlexItem>
      <TextContent>
        <Text component="h3">Component trace</Text>
      </TextContent>
      <CodeBlock>
        <CodeBlockCode>{trimEmptyLines(errorInfo.componentStack)}</CodeBlockCode>
      </CodeBlock>
    </FlexItem>
    <FlexItem>
      <TextContent>
        <Text component="h3">Stack trace</Text>
      </TextContent>
      <CodeBlock>
        <CodeBlockCode>{trimEmptyLines(error.stack || '')}</CodeBlockCode>
      </CodeBlock>
    </FlexItem>
  </Flex>
);

export default ErrorBoundaryFallback;
