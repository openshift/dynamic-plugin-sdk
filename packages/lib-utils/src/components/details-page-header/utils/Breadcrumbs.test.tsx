/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import type { BreadcrumbsProps } from './Breadcrumbs';
import { Breadcrumbs } from './Breadcrumbs';

const mockProps: BreadcrumbsProps = {
  breadcrumbs: [
    { name: 'Workspaces', path: '/workspaces' },
    { name: 'Workspace details', path: '/workspaces/demo-workspace' },
  ],
};

const breadcrumbsJSX = (args: BreadcrumbsProps) => (
  <MemoryRouter initialEntries={['/workspaces/demo-workspace']}>
    <Routes>
      <Route element={<Breadcrumbs {...args} />} path="/workspaces/demo-workspace" />
      <Route element={<div>Workspaces List Page</div>} path="/workspaces" />
    </Routes>
  </MemoryRouter>
);

describe('Breadcrumbs', () => {
  test('Breadcrumbs are rendered', () => {
    render(breadcrumbsJSX(mockProps));

    expect(screen.getByText('Workspaces')).toBeVisible();
    expect(screen.getByText('Workspace details')).toBeVisible();
  });
  test('Clicking on breadcrumb triggers specified path', () => {
    render(breadcrumbsJSX(mockProps));

    // Click Workspaces link
    fireEvent.click(screen.getByTestId('breadcrumb-link-0'));
    expect(screen.getByText('Workspaces List Page')).toBeVisible();
  });
});
