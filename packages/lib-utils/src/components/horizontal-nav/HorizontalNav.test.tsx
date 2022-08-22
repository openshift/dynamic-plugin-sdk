import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import type { Tab } from './HorizontalNav';
import HorizontalNav from './HorizontalNav';

// Sample content components for tabs
const UsersTabContent: React.FC = () => <div>Users Tab Content</div>;
const DatabaseTabContent: React.FC = () => <div>Database Tab Content</div>;

const mockTabs: Tab[] = [
  { key: 'Users', title: 'Users', content: <UsersTabContent />, ariaLabel: 'Users' },
  { key: 'Database', title: 'Database', content: <DatabaseTabContent />, ariaLabel: 'Database' },
];

describe('HorizontalNav', () => {
  test('loads and displays tabs with default selection', () => {
    render(<HorizontalNav tabs={mockTabs} />);

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Users');
    expect(screen.getByText('Users Tab Content')).toBeVisible();
  });

  test('switches tab on click', () => {
    render(<HorizontalNav tabs={mockTabs} />);

    fireEvent.click(screen.getByText('Database'));

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Database');
    expect(screen.getByText('Database Tab Content')).toBeVisible();
  });
});
