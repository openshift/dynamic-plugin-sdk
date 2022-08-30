import { screen, render, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import type { TableTestItem } from '../table/test-data';
import {
  testData as data,
  TestRow as Row,
  testColumns as columns,
  testFilters,
} from '../table/test-data';
import ListView, { filterDefault } from './ListView';

describe('TableView - non-virtualized', () => {
  it('should render with data', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
        <ListView
          data={data}
          columns={columns}
          Row={Row}
          filters={testFilters}
          loaded
          isRowSelected={undefined}
          onSelect={undefined}
          onFilter={undefined}
          loadError={undefined}
          CustomEmptyState={undefined}
          emptyStateDescription={undefined}
          CustomNoDataEmptyState={undefined}
          aria-label={undefined}
        />
      </MemoryRouter>,
    );
    data.forEach((item, index) => {
      expect(screen.getByTestId(`col-name-${index}`).textContent).toEqual(item.name);
      expect(screen.getByTestId(`col-prs-${index}`).textContent).toEqual(item.prs);
      expect(screen.getByTestId(`col-workspaces-${index}`).textContent).toEqual(
        String(item.workspaces),
      );
      expect(screen.getByTestId(`col-branches-${index}`).textContent).toEqual(item.branches);
    });
  });

  it('should show/hide chips & clear all button on search/clear', async () => {
    jest.useFakeTimers();
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
          <ListView
            data={data}
            columns={columns}
            Row={Row}
            filters={testFilters}
            loaded
            isRowSelected={undefined}
            onSelect={undefined}
            onFilter={undefined}
            loadError={undefined}
            CustomEmptyState={undefined}
            emptyStateDescription={undefined}
            CustomNoDataEmptyState={undefined}
            aria-label={undefined}
          />
        </MemoryRouter>,
      );
    });
    data.forEach((item, index) => {
      expect(screen.getByTestId(`col-name-${index}`).textContent).toEqual(item.name);
      expect(screen.getByTestId(`col-prs-${index}`).textContent).toEqual(item.prs);
      expect(screen.getByTestId(`col-workspaces-${index}`).textContent).toEqual(
        String(item.workspaces),
      );
      expect(screen.getByTestId(`col-branches-${index}`).textContent).toEqual(item.branches);
    });
    expect(screen.queryByText('X')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search by Name'), {
      target: { value: 'X' },
    });
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear filters'));
    expect(screen.queryByText('X')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('should call onFilter if passed', () => {
    const onFilter = jest.fn(() => data);
    render(
      <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
        <ListView
          data={data}
          columns={columns}
          Row={Row}
          filters={testFilters}
          onFilter={onFilter}
          loaded
          isRowSelected={undefined}
          onSelect={undefined}
          loadError={undefined}
          CustomEmptyState={undefined}
          emptyStateDescription={undefined}
          CustomNoDataEmptyState={undefined}
          aria-label={undefined}
        />
      </MemoryRouter>,
    );
    expect(onFilter).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByPlaceholderText('Search by Name'), {
      target: { value: 'X' },
    });
    expect(onFilter).toHaveBeenCalledTimes(2);
  });

  it('should be able to toggle filters', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
        <ListView
          data={data}
          columns={columns}
          Row={Row}
          filters={testFilters}
          loaded
          isRowSelected={undefined}
          onSelect={undefined}
          onFilter={undefined}
          loadError={undefined}
          CustomEmptyState={undefined}
          emptyStateDescription={undefined}
          CustomNoDataEmptyState={undefined}
          aria-label={undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('Search by Name')).toBeVisible();
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('option')[1]);
    expect(screen.queryByPlaceholderText('Search by Name')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by Branches')).toBeInTheDocument();
  });

  it('should filter rows correctly by default', () => {
    const filteredName = filterDefault([...data], {
      name: ['name-X'],
      branches: [],
      workspaces: [],
    });
    expect(filteredName.length).toEqual(1);
    expect(filteredName[0].name).toEqual(data[2].name);
    const filteredNameBranches = filterDefault([...data], {
      name: ['name-X'],
      branches: ['invalid-value'],
      workspaces: [],
    });
    expect(filteredNameBranches.length).toEqual(0);
  });

  it('should paginate the table correctly', () => {
    let longData: TableTestItem[] = [];
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < 20; index++) {
      const idx = String(index).padStart(3, '0');
      longData = [
        ...longData,
        {
          id: index,
          name: `name-${idx}`,
          prs: `prs-${idx}`,
          branches: `branches-${idx}`,
          workspaces: index,
        },
      ];
    }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
        <ListView
          data={longData}
          columns={columns}
          Row={Row}
          filters={testFilters}
          loaded
          isRowSelected={undefined}
          onSelect={undefined}
          onFilter={undefined}
          loadError={undefined}
          CustomEmptyState={undefined}
          emptyStateDescription={undefined}
          CustomNoDataEmptyState={undefined}
          aria-label={undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('col-name-0').textContent).toEqual('name-000');
    fireEvent.click(screen.getAllByRole('button')[4]);
    expect(screen.getByTestId('col-name-0').textContent).toEqual('name-010');
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(screen.getByTestId('col-name-0').textContent).toEqual('name-000');
    fireEvent.click(screen.getAllByRole('button')[5]);
    expect(screen.getByTestId('col-name-0').textContent).toEqual('name-010');
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(screen.getByTestId('col-name-0').textContent).toEqual('name-000');
  });
});
