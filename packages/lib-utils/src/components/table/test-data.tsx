import { sortable, Td } from '@patternfly/react-table';
import * as React from 'react';
import type { FilterItem } from '../list-view/ListView';
import type { RowProps, TableColumn } from './VirtualizedTableBody';

export const testData: TableTestItem[] = [
  {
    uuid: 1,
    name: 'name-Y',
    prs: 'prs-Y',
    branches: 'branches-Y',
    workspaces: 3,
  },
  {
    uuid: 2,
    name: 'name-Z',
    prs: 'prs-Z',
    branches: 'branches-Z',
    workspaces: 1,
  },
  {
    uuid: 3,
    name: 'name-X',
    prs: 'prs-X',
    branches: 'branches-X',
    workspaces: 2,
  },
];

export const testFilters: FilterItem[] = [
  {
    id: 'name',
    label: 'Name',
  },
  {
    id: 'branches',
    label: 'Branches',
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
  },
];

export const testColumns: TableColumn<TableTestItem>[] = [
  {
    title: 'Name',
    id: 'name',
    transforms: [sortable],
    sort: 'name',
  },
  {
    title: 'PRs',
    id: 'prs',
    sort: 'prs',
  },
  {
    title: 'Branches',
    id: 'branches',
  },
  {
    title: 'Workspaces',
    id: 'workspaces',
    sort: 'workspaces',
  },
];

export type TableTestItem = {
  uuid: number;
  name: string;
  prs: string;
  branches: string;
  workspaces: number;
};

export const TestRow: React.FC<RowProps<TableTestItem>> = ({ obj, index }) => {
  return (
    <>
      <Td data-testid={`col-name-${index}`} dataLabel={obj.name}>
        {obj.name}
      </Td>
      <Td data-testid={`col-prs-${index}`} dataLabel={obj.prs}>
        {obj.prs}
      </Td>
      <Td data-testid={`col-branches-${index}`} dataLabel={obj.branches}>
        {obj.branches}
      </Td>
      <Td data-testid={`col-workspaces-${index}`} dataLabel={String(obj.workspaces)}>
        {obj.workspaces}
      </Td>
    </>
  );
};
