/* eslint-disable react/jsx-props-no-spreading */
import { Button, ButtonVariant, Text, TextContent, TextVariants } from '@patternfly/react-core';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import GettingStartedCard from './GettingStartedCard';
import imgSrc from './GettingStartedCard.svg';

const meta: ComponentMeta<typeof GettingStartedCard> = {
  title: 'GettingStartedCard',
  component: GettingStartedCard,
  argTypes: {},
};

export default meta;

const Template: ComponentStory<typeof GettingStartedCard> = (args) => {
  return (
    <GettingStartedCard {...args}>
      <TextContent>
        <Text component={TextVariants.p}>
          Workspaces provide a Kubernetes-like API to create and manage container-based apps without
          needing to set up or worry about the infrastructure underneath them.
        </Text>
        <Button
          variant={ButtonVariant.secondary}
          /* eslint-disable-next-line no-console */
          onClick={() => console.log('Learn more clicked')}
          isInline
        >
          Learn more
        </Button>
      </TextContent>
    </GettingStartedCard>
  );
};

export const Primary = Template.bind({});

Primary.args = {
  imgClassName: 'pf-u-my-lg pf-u-ml-lg pf-u-display-none pf-u-display-block-on-md',
  imgSrc,
  isDismissable: true,
  localStorageKey: 'get-started-with-workspaces',
  title: 'Get started with Workspaces',
};
