/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import type { DetailsPageHeaderProps } from './DetailsPageHeader';
import { DetailsPageHeader } from './DetailsPageHeader';

const mockCallback = jest.fn();

const mockProps: DetailsPageHeaderProps = {
  breadcrumbs: [
    { name: 'Workspaces', path: '/workspaces' },
    { name: 'Workspace details', path: '/workspaces/demo-workspace' },
  ],
  pageHeading: {
    title: 'demo-workspace',
  },
  actionButtons: [
    {
      label: 'Test Button',
      callback: mockCallback,
    },
  ],
  actionMenu: {
    actions: [
      {
        id: '2',
        label: 'Delete Action',
        cta: {
          callback: jest.fn(),
        },
        isDisabled: true,
      },
      {
        id: 'Link1',
        label: 'Link1',
        cta: {
          href: '#',
        },
      },
    ],
    isDisabled: false,
  },
};

const detailsPageHeaderJSX = (args: DetailsPageHeaderProps) => (
  <MemoryRouter initialEntries={['/workspaces/demo-workspace']}>
    <Routes>
      <Route element={<DetailsPageHeader {...args} />} path="/workspaces/demo-workspace" />
      <Route element={<div>Workspaces List Page</div>} path="/workspaces" />
    </Routes>
  </MemoryRouter>
);

describe('DetailsPageHeader', () => {
  test('DetailsPageHeader is rendered with breadcrumbs, heading, action buttons and action menu', () => {
    render(detailsPageHeaderJSX(mockProps));

    // Breadcrumbs
    expect(screen.getByText('Workspaces')).toBeVisible();
    expect(screen.getByText('Workspace details')).toBeVisible();
    // Page heading
    expect(screen.getByText('demo-workspace')).toBeVisible();
    // Action buttons
    expect(screen.getByText('Test Button')).toBeVisible();
    // Action menu
    expect(screen.getByText('Actions')).toBeVisible();
  });
  test('Clicking on breadcrumb triggers specified path', () => {
    render(detailsPageHeaderJSX(mockProps));

    // Click Workspaces link
    fireEvent.click(screen.getByTestId('breadcrumb-link-0'));
    expect(screen.getByText('Workspaces List Page')).toBeVisible();
  });
  test('Clicking on actions menu reveals menu options', () => {
    render(detailsPageHeaderJSX(mockProps));

    fireEvent.click(screen.getByText('Actions'));
    expect(screen.getByText('Link1')).toBeVisible();
    expect(screen.getByText('Delete Action')).toBeVisible();
    expect(screen.getByText('Delete Action').closest('a')).toHaveAttribute('aria-disabled');
  });
  test('Action button triggers callback', () => {
    render(detailsPageHeaderJSX(mockProps));

    fireEvent.click(screen.getByText('Test Button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
