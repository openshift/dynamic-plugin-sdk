/* eslint-disable react/jsx-props-no-spreading */
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import type { K8sResourceCommon } from '../../types/k8s';
import { OverviewPage } from '../resource-summary';
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
    creationTimestamp: '2022-09-15T21:07:32Z',
  },
};

export const PlaceholderComponent: React.FC<{ value: string }> = ({ value }) => (
  <TextContent>
    <Text component={TextVariants.h3}>{value}</Text>
  </TextContent>
);

Primary.args = {
  ariaLabel: 'Workspace details',
  tabs: [
    {
      key: 'overview',
      title: 'Overview',
      content: (
        <OverviewPage resource={mockWorkspace} rightColumn={<>Right column content</>}>
          <span>Additional content</span>
        </OverviewPage>
      ),
      ariaLabel: 'Overview',
    },
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
