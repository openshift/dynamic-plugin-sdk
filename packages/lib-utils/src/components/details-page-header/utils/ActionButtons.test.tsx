import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionButtons } from './ActionButtons';

const mockCallback = jest.fn();

const mockActionButtons = [
  {
    label: 'Edit Workspace',
    callback: mockCallback,
  },
  {
    label: 'Delete Workspace',
    callback: jest.fn(),
    isDisabled: true,
    tooltip: 'Deletion is currently unavailable',
  },
];

describe('ActionButtons', () => {
  test('Buttons are rendered', () => {
    render(<ActionButtons actionButtons={mockActionButtons} />);

    expect(screen.getByText('Edit Workspace')).toBeVisible();
    expect(screen.getByText('Delete Workspace')).toBeVisible();
    expect(screen.getByText('Delete Workspace').closest('button')).toHaveAttribute('aria-disabled');
  });
  test('Button clicks trigger callback', () => {
    render(<ActionButtons actionButtons={mockActionButtons} />);

    fireEvent.click(screen.getByText('Edit Workspace'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
