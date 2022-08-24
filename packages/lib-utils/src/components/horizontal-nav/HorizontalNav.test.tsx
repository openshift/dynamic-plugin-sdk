import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import type { Tab } from './HorizontalNav';
import { HorizontalNav, HorizontalNavTabs } from './HorizontalNav';

// Sample content components for tabs
const UsersTabContent: React.FC = () => <div>Users Tab Content</div>;
const DatabaseTabContent: React.FC = () => <div>Database Tab Content</div>;

const mockTabs: Tab[] = [
  { key: 'Users', title: 'Users', content: <UsersTabContent />, ariaLabel: 'Users' },
  { key: 'Database', title: 'Database', content: <DatabaseTabContent />, ariaLabel: 'Database' },
];

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    selectedTab: 'Database',
  }),
  useLocation: () => ({
    pathname: 'testNav/Database',
  }),
}));

describe('HorizontalNav', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });
  describe('Horizontal tabs with routing', () => {
    test('loads and displays tabs with initial selection based on route param', () => {
      render(
        <BrowserRouter>
          <HorizontalNav tabs={mockTabs} />
        </BrowserRouter>,
      );

      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Database');
      expect(screen.getByText('Database Tab Content')).toBeVisible();
    });

    test('switches tab on click', () => {
      render(
        <BrowserRouter>
          <HorizontalNav tabs={mockTabs} />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByText('Users'));

      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Users');
    });
  });
  describe('Standalone horizontal tabs without routing', () => {
    test('loads and displays tabs with default selection', () => {
      render(<HorizontalNavTabs tabs={mockTabs} />);

      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Users');
      expect(screen.getByText('Users Tab Content')).toBeVisible();
    });

    test('switches tab on click', () => {
      render(<HorizontalNavTabs tabs={mockTabs} />);

      fireEvent.click(screen.getByText('Database'));

      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Database');
      expect(screen.getByText('Database Tab Content')).toBeVisible();
    });
  });
});
