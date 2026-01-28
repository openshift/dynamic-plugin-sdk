import { Flex, FlexItem, Content, CodeBlock, CodeBlockCode } from '@patternfly/react-core';
// eslint-disable-next-line camelcase
import { t_global_spacer_md } from '@patternfly/react-tokens';
import type { FC } from 'react';
import type { ErrorBoundaryFallbackProps } from './ErrorBoundary';

const trimEmptyLines = (text: string) => text.replace(/^\s*\n/gm, '');

const ErrorBoundaryFallback: FC<ErrorBoundaryFallbackProps> = ({ error, errorInfo }) => (
  <Flex direction={{ default: 'column' }} style={{ padding: t_global_spacer_md.value }}>
    <FlexItem>
      <Content component="h1">Oh no! Something went wrong.</Content>
      <Content component="h2">{error.name}</Content>
      <Content component="p">Error message: {error.message ?? '(empty)'}</Content>
    </FlexItem>
    <FlexItem>
      <Content component="h3">Component trace</Content>
      <CodeBlock>
        <CodeBlockCode>{trimEmptyLines(errorInfo.componentStack ?? '(empty)')}</CodeBlockCode>
      </CodeBlock>
    </FlexItem>
    <FlexItem>
      <Content component="h3">Stack trace</Content>
      <CodeBlock>
        <CodeBlockCode>{trimEmptyLines(error.stack ?? '(empty)')}</CodeBlockCode>
      </CodeBlock>
    </FlexItem>
  </Flex>
);

export default ErrorBoundaryFallback;
