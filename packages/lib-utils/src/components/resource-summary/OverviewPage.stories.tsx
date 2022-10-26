/* eslint-disable react/jsx-props-no-spreading */
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import { OverviewPage, DetailsItem, DetailsItemList } from './index';

const meta: ComponentMeta<typeof OverviewPage> = {
  title: 'OverviewPage (tab content)',
  component: OverviewPage,
  argTypes: {},
};

export default meta;

const mockWorkspace: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'demo-workspace',
    labels: {
      label1: 'value1',
      label2: 'value2',
    },
    creationTimestamp: '2022-09-15T21:07:32Z',
  },
};

const DetailsPageTemplate: ComponentStory<typeof OverviewPage> = (args) => {
  return <OverviewPage {...args} />;
};

export const Primary = DetailsPageTemplate.bind({});

Primary.args = {
  resource: mockWorkspace,
};

export const AdditionalContent = DetailsPageTemplate.bind({});

const ChildContent = <DetailsItem label="Hello">World</DetailsItem>;

const RightColumn = (
  <DetailsItemList>
    <DetailsItem label="More">content</DetailsItem>
  </DetailsItemList>
);

AdditionalContent.args = {
  resource: mockWorkspace,
  children: ChildContent,
  rightColumn: RightColumn,
};

export const Loading = DetailsPageTemplate.bind({});

Loading.args = { loaded: false, rightColumn: RightColumn };

export const NotFound = DetailsPageTemplate.bind({});

NotFound.args = { loaded: true, loadError: { message: 'File not found', status: 404 } };

export const ServerError = DetailsPageTemplate.bind({});

ServerError.args = {
  loaded: true,
  loadError: { message: 'Error message from error object', status: 500 },
};
