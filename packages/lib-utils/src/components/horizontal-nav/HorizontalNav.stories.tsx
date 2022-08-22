/* eslint-disable react/jsx-props-no-spreading */
import { Card, CardTitle, CardBody } from '@patternfly/react-core';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import type { Tab } from './HorizontalNav';
import HorizontalNav from './HorizontalNav';

const meta: ComponentMeta<typeof HorizontalNav> = {
  title: 'HorizontalNav',
  component: HorizontalNav,
  argTypes: {},
};

export default meta;

const Template: ComponentStory<typeof HorizontalNav> = (args) => {
  return <HorizontalNav {...args} />;
};

export const Primary = Template.bind({});

// Sample content components for tabs
const BaseContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Card style={{ minHeight: '20em' }}>
      <CardTitle>{content}</CardTitle>
      <CardBody>Sample content</CardBody>
    </Card>
  );
};

const UsersTabContent: React.FC = () => {
  return <BaseContent content="Users Tab Content" />;
};

const ContainersTabContent: React.FC = () => {
  return <BaseContent content="Containers Tab Content" />;
};

const DatabaseTabContent: React.FC = () => {
  return <BaseContent content="Database Tab Content" />;
};

// Define tabs
const tabs: Tab[] = [
  { key: 'Users', title: 'Users', content: <UsersTabContent />, ariaLabel: 'Users' },
  {
    key: 'Containers',
    title: 'Containers',
    content: <ContainersTabContent />,
    ariaLabel: 'Containers',
  },
  { key: 'Database', title: 'Database', content: <DatabaseTabContent />, ariaLabel: 'Database' },
];
const ariaLabel = 'Sample tabs';

Primary.args = {
  ariaLabel,
  tabs,
};
