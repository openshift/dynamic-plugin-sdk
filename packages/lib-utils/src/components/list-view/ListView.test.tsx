import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
// import { axe } from 'jest-axe';
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

  // Uncomment once https://github.com/openshift/dynamic-plugin-sdk/pull/168 has been merged
  // That PR adds jest-axe
  // it('is accessible on load', async () => {
  // const { container } = render(
  //   <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
  //     <ListView
  //       data={data}
  //       columns={columns}
  //       Row={Row}
  //       filters={testFilters}
  //       loaded
  //       isRowSelected={undefined}
  //       onSelect={undefined}
  //       onFilter={undefined}
  //       loadError={undefined}
  //       CustomEmptyState={undefined}
  //       emptyStateDescription={undefined}
  //       CustomNoDataEmptyState={undefined}
  //       aria-label={undefined}
  //       actionButtons={[
  //         {
  //           label: 'Add',
  //           callback: () => null,
  //           tooltip: 'Add a workspace by clicking on the button',
  //         },
  //         {
  //           label: 'Delete',
  //           callback: () => null,
  //           isDisabled: true,
  //         },
  //       ]}
  //     />
  //   </MemoryRouter>,
  // );
  //   const results = await axe(container);
  //   expect(results).toHaveNoViolations();
  // });

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
    for (let index = 0; index < 20; index += 1) {
      const idx = String(index).padStart(3, '0');
      longData = [
        ...longData,
        {
          uuid: index,
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

  it('action buttons are rendered and functional', async () => {
    const callbackMock = jest.fn();
    render(
      <MemoryRouter initialEntries={[{ pathname: '/hac' }]}>
        <ListView
          data={data}
          columns={columns}
          Row={Row}
          filters={testFilters}
          loaded
          actionButtons={[
            {
              label: 'Add',
              callback: callbackMock,
              tooltip: 'Add a workspace by clicking on the button',
            },
            {
              label: 'Delete',
              callback: () => null,
              isDisabled: true,
            },
          ]}
        />
      </MemoryRouter>,
    );

    // Patternfly doesn't add the proper disabled attribute, so need to check for aria fallback
    //  expect(screen.getByText('Delete')).toBeDisabled(); /doesn't  work
    expect(screen.getByText('Add').getAttribute('aria-disabled')).toEqual('false');
    expect(screen.getByText('Delete').getAttribute('aria-disabled')).toEqual('true');

    // Check that tooltip is rendered
    expect(screen.queryByText('Add a workspace by clicking on the button')).not.toBeInTheDocument();
    fireEvent.focus(screen.getByText('Add'));
    expect(
      await screen.findByText('Add a workspace by clicking on the button'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(callbackMock).toHaveBeenCalledTimes(1));
  });
});
