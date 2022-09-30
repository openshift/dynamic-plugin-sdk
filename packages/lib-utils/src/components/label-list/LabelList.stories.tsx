/* eslint-disable react/jsx-props-no-spreading */
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import type { LabelListProps } from './LabelList';
import { LabelList } from './LabelList';

const meta: ComponentMeta<typeof LabelList> = {
  title: 'LabelList',
  component: LabelList,
  subcomponents: { LabelList },
  argTypes: {},
};

export default meta;

const Template: ComponentStory<typeof LabelList> = (args) => <LabelList {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  labels: {
    'test-label': 'test-value',
    'test-label1': 'test-value1',
    'test-label2': 'test-value2',
    'test-label3': 'test-value3',
    'test-label4': 'test-value4',
  },
} as LabelListProps;

export const Secondary = Template.bind({});

Secondary.args = {
  labels: {
    'test-label': 'test-value',
    'test-label1': 'test-value1',
  },
  hrefForLabels: {
    'test-label': `/?label=${encodeURIComponent('test-label')}`,
    'test-label1': `/?label=${encodeURIComponent('test-label1')}`,
  },
  icon: <InfoCircleIcon />,
  color: 'grey',
} as LabelListProps;
