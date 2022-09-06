/* eslint-disable react/jsx-props-no-spreading */
import { EyeIcon } from '@patternfly/react-icons/dist/js/icons/eye-icon';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import type { LabelListProps } from '../label-list/LabelList';
import { Primary as PrimaryLabelList } from '../label-list/LabelList.stories';
import { DetailsItem } from './DetailsItem';

const meta: ComponentMeta<typeof DetailsItem> = {
  title: 'DetailsItem',
  component: DetailsItem,
  argTypes: {},
};

export default meta;

// Primary Template
const Template: ComponentStory<typeof DetailsItem> = (args) => {
  return (
    <div style={{ width: '50vw' }}>
      <DetailsItem {...args} />
    </div>
  );
};

export const Primary = Template.bind({});

const firstObj: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'Test Workspace',
  },
  spec: {},
};
const path = 'metadata.name';
const title = 'Name';
const hideEmpty = true;

Primary.args = {
  title,
  titleLabel: {
    name: 'Service Preview',
    color: 'blue',
    icon: <EyeIcon />,
  },
  obj: firstObj,
  path,
  hideEmpty,
};

// Secondary template (with content component for description)
const SecondTemplate: ComponentStory<typeof DetailsItem> = (args) => {
  return (
    <div style={{ width: '50vw' }}>
      <DetailsItem {...args}>
        <PrimaryLabelList {...(PrimaryLabelList.args as LabelListProps)} />
      </DetailsItem>
    </div>
  );
};

const secondObj: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'Test Workspace',
    labels: {
      'test-label': 'test-value',
      'test-label2': 'test-value2',
      'test-label3': 'test-value3',
    },
  },
  spec: {},
};

export const Secondary = SecondTemplate.bind({});

Secondary.args = {
  title: 'Labels',
  obj: secondObj,
  path: 'metadata.labels',
  hideEmpty,
};
