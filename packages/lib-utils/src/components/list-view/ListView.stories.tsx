/* eslint-disable react/jsx-props-no-spreading */
import type { AnyObject } from '@openshift/dynamic-plugin-sdk';
import { Button, Tooltip } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Td } from '../table/VirtualizedTableBody';
import ListView from './ListView';

export type TableItem = {
  name: string;
  kind: string;
  labels: string;
};

const meta: ComponentMeta<typeof ListView> = {
  title: 'ListView',
  component: ListView,
  argTypes: {},
};

export default meta;

const Template: ComponentStory<typeof ListView> = (args) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  return (
    <BrowserRouter>
      <div style={{ overflowY: 'auto' }}>
        <ListView
          {...args}
          onSelect={(e, isRowSelected, selectedData) =>
            isRowSelected
              ? setSelected([...new Set([...selected, ...selectedData.map((i) => String(i.name))])])
              : setSelected(
                  selected.filter((i) => !selectedData.map((item) => item.name).includes(i)),
                )
          }
          isRowSelected={(i) => selected.includes(i.name as string)}
        />
      </div>
    </BrowserRouter>
  );
};

type RowProps<D> = {
  obj: D;
};

const Row: React.FC<RowProps<TableItem>> = ({ obj }) => {
  return (
    <>
      <Td dataLabel={obj.name}>{obj.name}</Td>
      <Td dataLabel={obj.kind}>{obj.kind}</Td>
      <Td dataLabel={obj.labels}>{obj.labels}</Td>
    </>
  );
};

export const Primary = Template.bind({});
let data: TableItem[] = [];
for (let index = 0; index < 100; index += 1) {
  const idx = String(index).padStart(3, '0');
  data = [
    ...data,
    {
      name: `name-${idx}`,
      kind: `kind-${idx}`,
      labels: `labels-${idx}`,
    },
  ];
}
Primary.args = {
  loaded: true,
  data,
  columns: [
    {
      title: 'Name',
      id: 'name',
      props: {
        className: '',
      },
    },
    {
      title: (
        <>
          Kind{' '}
          <Tooltip content="More information about Kind">
            <Button variant="plain">
              <HelpIcon />
            </Button>
          </Tooltip>
        </>
      ),
      id: 'kind',
      props: {
        className: '',
      },
    },
    {
      title: 'Labels',
      id: 'labels',
      transforms: [sortable],
      props: {
        className: '',
      },
    },
  ],
  Row: Row as React.FC<RowProps<AnyObject>>,
  filters: [
    {
      id: 'name',
      label: 'Name',
    },
    {
      id: 'kind',
      label: 'Kind',
    },
    {
      id: 'labels',
      label: 'Labels',
    },
  ],
  rowActions: [
    {
      title: 'Edit',
      onClick: () => null,
    },
    {
      title: 'Delete',
      onClick: () => null,
    },
  ],
  onFilter: undefined,
  onSelect: () => null,
  scrollNode: undefined,
  emptyStateDescription: 'No matching data found...',
  virtualized: false,
  actionButtons: [
    {
      label: 'Add',
      // eslint-disable-next-line no-console
      callback: () => console.log('Adding workspace'),
      tooltip: 'Add a workspace by clicking on the button',
    },
    {
      label: 'Delete',
      callback: () => null,
      isDisabled: true,
    },
  ],
};
