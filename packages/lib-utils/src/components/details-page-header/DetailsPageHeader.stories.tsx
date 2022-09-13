/* eslint-disable react/jsx-props-no-spreading */
import { CheckCircleIcon } from '@patternfly/react-icons';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import type { K8sResourceCommon } from '../../types/k8s';
import { DetailsPageHeader } from './DetailsPageHeader';

const meta: ComponentMeta<typeof DetailsPageHeader> = {
  title: 'DetailsPageHeader',
  component: DetailsPageHeader,
  argTypes: {},
};

export default meta;

const DetailsPageHeaderTemplate: ComponentStory<typeof DetailsPageHeader> = (args) => {
  return (
    <MemoryRouter initialEntries={['/workspaces/demo-workspace']}>
      <Routes>
        <Route element={<DetailsPageHeader {...args} />} path="/workspaces/demo-workspace" />
        <Route
          element={
            <div>
              <p>Workspaces List Page</p>
              <button type="button">
                <Link to="/workspaces/demo-workspace">Demo Workspace</Link>
              </button>
            </div>
          }
          path="/workspaces"
        />
      </Routes>
    </MemoryRouter>
  );
};

export const Primary = DetailsPageHeaderTemplate.bind({});

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

Primary.args = {
  breadcrumbs: [
    { name: 'Workspaces', path: '/workspaces' },
    { name: 'Workspace details', path: '/workspaces/demo-workspace' },
  ],
  obj: mockWorkspace,
  pageHeadingLabel: {
    name: 'Ready',
    icon: <CheckCircleIcon color="#3E8635" />,
  },
  actionButtons: [
    {
      label: 'Test',
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
        label: 'Edit Action',
        cta: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
            // eslint-disable-next-line no-console
            console.log('Edit Action', event);
          },
        },
        tooltip: 'Sample tooltip',
      },
      {
        id: '2',
        label: 'Delete Action',
        cta: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
            // eslint-disable-next-line no-console
            console.log('Delete Action', event);
          },
        },
        isDisabled: true,
      },
      {
        id: 'Link1',
        label: 'External Link',
        cta: {
          href: 'https://github.com/',
          external: true,
        },
      },
    ],
    isDisabled: false,
  },
};
