/* eslint-disable react/jsx-props-no-spreading */
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import GettingStartedCard from './GettingStartedCard';

const localStorageKey = 'get-started-with-workspaces';
const title = 'Get started with Workspaces';
const imgSrc = 'mock.svg';
const getStartedCardProps = {
  localStorageKey,
  title,
  imgSrc,
};
const children = (
  <TextContent>
    <Text component={TextVariants.p}>
      Workspaces provide a Kubernetes-like API to create and manage container-based apps without
      needing to set up or worry about the infrastructure underneath them.
    </Text>
  </TextContent>
);

describe('GettingStartedCard', () => {
  it('should not be dismissable when isDismissable === false', () => {
    render(
      <GettingStartedCard {...getStartedCardProps} isDismissable={false}>
        {children}
      </GettingStartedCard>,
    );
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('should be hidden when dismissed', () => {
    render(<GettingStartedCard {...getStartedCardProps}>{children}</GettingStartedCard>);
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByRole('button')).toBeVisible();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText(title)).not.toBeInTheDocument();
  });
});
