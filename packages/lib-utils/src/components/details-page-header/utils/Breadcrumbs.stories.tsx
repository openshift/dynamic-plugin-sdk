/* eslint-disable react/jsx-props-no-spreading */
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import type { BreadcrumbProp } from './Breadcrumbs';
import { Breadcrumbs } from './Breadcrumbs';

const meta: ComponentMeta<typeof Breadcrumbs> = {
  title: 'Breadcrumbs',
  component: Breadcrumbs,
  argTypes: {},
};

export default meta;

const BreadcrumbsTemplate: ComponentStory<typeof Breadcrumbs> = (args) => {
  return (
    <MemoryRouter initialEntries={['/workspaces/demo-workspace']}>
      <Routes>
        <Route element={<Breadcrumbs {...args} />} path="/workspaces/demo-workspace" />
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

export const Primary = BreadcrumbsTemplate.bind({});

// Define tabs
const breadcrumbs: BreadcrumbProp[] = [
  { name: 'Workspaces', path: '/workspaces' },
  { name: 'Workspace details', path: '/workspaces/demo-workspace' },
];

Primary.args = {
  breadcrumbs,
};
