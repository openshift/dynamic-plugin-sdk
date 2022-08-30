import { sortable, Td } from '@patternfly/react-table';
import * as React from 'react';
import type { FilterItem } from '../list-view/ListView';
import type { RowProps, TableColumn } from './VirtualizedTable';

export const testData: TableTestItem[] = [
  {
    id: 1,
    name: 'name-Y',
    prs: 'prs-Y',
    branches: 'branches-Y',
    workspaces: 3,
  },
  {
    id: 2,
    name: 'name-Z',
    prs: 'prs-Z',
    branches: 'branches-Z',
    workspaces: 1,
  },
  {
    id: 3,
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

export const testColumns: TableColumn[] = [
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
  id: number;
  name: string;
  prs: string;
  branches: string;
  workspaces: number;
};

export const TestRow: React.FC<RowProps> = ({ obj, index }) => {
  const item = obj as TableTestItem;
  return (
    <>
      <Td data-testid={`col-name-${index}`} dataLabel={item.name}>
        {item.name}
      </Td>
      <Td data-testid={`col-prs-${index}`} dataLabel={item.prs}>
        {item.prs}
      </Td>
      <Td data-testid={`col-branches-${index}`} dataLabel={item.branches}>
        {item.branches}
      </Td>
      <Td data-testid={`col-workspaces-${index}`} dataLabel={String(item.workspaces)}>
        {item.workspaces}
      </Td>
    </>
  );
};
