/* eslint-disable react/jsx-props-no-spreading */
import {
  TextContent,
  Text,
  TextVariants,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  Label,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import type { K8sResourceCommon } from '../../types/k8s';
import { DetailsPage } from './DetailsPage';

const meta: ComponentMeta<typeof DetailsPage> = {
  title: 'DetailsPage',
  component: DetailsPage,
  argTypes: {},
};

export default meta;

const DetailsPageTemplate: ComponentStory<typeof DetailsPage> = (args) => {
  return (
    <MemoryRouter initialEntries={['/workspaces/demo-workspace']}>
      <Routes>
        <Route element={<DetailsPage {...args} />} path="/workspaces/demo-workspace" />
        <Route element={<DetailsPage {...args} />} path="/workspaces/demo-workspace/:selectedTab" />
        <Route
          element={
            <div>
              <p>Workspaces List Page</p>
              <a href="/workspaces" type="button">
                <Link to="/workspaces/demo-workspace">Demo Workspace</Link>
              </a>
            </div>
          }
          path="/workspaces"
        />
      </Routes>
    </MemoryRouter>
  );
};

export const Primary = DetailsPageTemplate.bind({});

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
  },
};

export const SampleOverview: React.FC = () => (
  <DescriptionList
    columnModifier={{
      default: '2Col',
    }}
  >
    <DescriptionListGroup>
      <DescriptionListTerm>Name</DescriptionListTerm>
      <DescriptionListDescription>demo-workspace</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Members</DescriptionListTerm>
      <DescriptionListDescription>Alex and 3 others</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Services</DescriptionListTerm>
      <DescriptionListDescription>
        <Label>App Studio</Label>
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>APIs</DescriptionListTerm>
      <DescriptionListDescription>
        <a href="/apis">21 kinds</a>
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Labels</DescriptionListTerm>
      <DescriptionListDescription>
        <Label>internal.kcp.dev/phase=Ready</Label>
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Applications</DescriptionListTerm>
      <DescriptionListDescription>
        <span>
          <a href="/">Demo app</a>,<a href="/">Billing app</a>
        </span>
      </DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>
);

export const PlaceholderComponent: React.FC<{ value: string }> = ({ value }) => (
  <TextContent>
    <Text component={TextVariants.h3}>{value}</Text>
  </TextContent>
);

Primary.args = {
  ariaLabel: 'Workspace details',
  tabs: [
    { key: 'overview', title: 'Overview', content: <SampleOverview />, ariaLabel: 'Overview' },
    {
      key: 'applications',
      title: 'Applications',
      content: <PlaceholderComponent value="Applications" />,
      ariaLabel: 'applications',
    },
    {
      key: 'environments',
      title: 'Environments',
      content: <PlaceholderComponent value="Environments" />,
      ariaLabel: 'Environments',
    },
    {
      key: 'apis',
      title: 'APIs',
      content: <PlaceholderComponent value="APIs" />,
      ariaLabel: 'APIs',
    },
  ],
  breadcrumbs: [
    { name: 'Workspaces', path: '/workspaces' },
    { name: 'Workspace details', path: '/workspaces/demo-workspace' },
  ],
  obj: mockWorkspace,
  pageHeading: {
    label: {
      name: 'Ready',
      icon: <CheckCircleIcon color="#3E8635" />,
    },
  },
  actionButtons: [
    {
      label: 'Download kubeconfig',
      callback: (event: React.MouseEvent) => {
        // eslint-disable-next-line no-console
        console.log('Test Action', event);
      },
    },
  ],
  actionMenu: {
    actions: [
      {
        id: '1',
        label: 'Edit workspace',
        cta: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
            // eslint-disable-next-line no-console
            console.log('Edit workspace', event);
          },
        },
      },
      {
        id: '2',
        label: 'Delete workspace',
        cta: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
            // eslint-disable-next-line no-console
            console.log('Delete workspace', event);
          },
        },
        isDisabled: true,
        tooltip: 'Sample tooltip',
      },
    ],
    isDisabled: false,
  },
};
