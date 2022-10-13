import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionMenu } from './ActionMenu';

const mockCallback = jest.fn();

const mockActions = [
  {
    id: '1',
    label: 'Edit Action',
    cta: {
      callback: mockCallback,
    },
  },
  {
    id: '2',
    label: 'Delete Action',
    cta: {
      callback: jest.fn(),
    },
    isDisabled: true,
  },
];

const mockGroupedActions = [
  {
    groupId: 'group1',
    groupActions: [
      {
        id: '1',
        label: 'Edit Action',
        cta: {
          callback: jest.fn(),
        },
        tooltip: 'Sample tooltip',
      },
      {
        id: '2',
        label: 'Delete Action',
        cta: {
          callback: jest.fn(),
        },
        isDisabled: true,
      },
    ],
  },
  {
    groupId: 'group2',
    groupLabel: 'Group2',
    groupActions: [
      {
        id: 'Link1',
        label: 'External Link',
        cta: {
          href: 'https://github.com/',
          external: true,
        },
      },
      {
        id: 'Link2',
        label: 'Link',
        cta: {
          href: '/#',
          external: false,
        },
        tooltip: 'Link',
      },
    ],
  },
];

describe('ActionMenu', () => {
  test('ActionMenu is rendered', () => {
    render(<ActionMenu actions={mockActions} />);

    expect(screen.getByText('Actions')).toBeVisible();
  });
  test('ActionMenu dropdown is expanded', () => {
    render(<ActionMenu actions={mockActions} label="Test Actions" />);

    fireEvent.click(screen.getByText('Test Actions'));
    expect(screen.getByText('Edit Action')).toBeVisible();
    expect(screen.getByText('Delete Action')).toBeVisible();
    expect(screen.getByText('Delete Action').closest('a')).toHaveAttribute('aria-disabled');
  });
  test('ActionMenu is disabled', () => {
    render(<ActionMenu actions={mockActions} isDisabled />);

    expect(screen.getByText('Actions').closest('button')).toHaveAttribute('disabled');
  });
  test('Menu actions trigger callback', () => {
    render(<ActionMenu actions={mockActions} />);

    fireEvent.click(screen.getByText('Actions'));
    expect(screen.getByText('Edit Action')).toBeVisible();
    fireEvent.click(screen.getByText('Edit Action'));
    expect(mockCallback).toHaveBeenCalled();
  });
  test('Menu actions are rendered in groups', () => {
    render(<ActionMenu groupedActions={mockGroupedActions} />);

    fireEvent.click(screen.getByText('Actions'));
    expect(screen.getByText('Edit Action')).toBeVisible();
    expect(screen.getByText('Group2')).toBeVisible();
    expect(screen.getByText('External Link')).toBeVisible();
  });
});
