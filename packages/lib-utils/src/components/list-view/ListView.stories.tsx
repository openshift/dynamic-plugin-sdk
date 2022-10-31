/* eslint-disable react/jsx-props-no-spreading */
import { Button, Tooltip } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import type { RowProps } from '../table/VirtualizedTableBody';
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
              ? setSelected([
                  ...new Set([...selected, ...selectedData.map((i) => (i as TableItem).name)]),
                ])
              : setSelected(
                  selected.filter(
                    (i) => !selectedData.map((item) => (item as TableItem).name).includes(i),
                  ),
                )
          }
          isRowSelected={(i) => selected.includes((i as TableItem).name)}
        />
      </div>
    </BrowserRouter>
  );
};

const Row: React.FC<RowProps> = ({ obj }) => {
  const item = obj as TableItem;
  return (
    <>
      <Td dataLabel={item.name}>{item.name}</Td>
      <Td dataLabel={item.kind}>{item.kind}</Td>
      <Td dataLabel={item.labels}>{item.labels}</Td>
    </>
  );
};

export const Primary = Template.bind({});
let data: TableItem[] = [];
// eslint-disable-next-line no-plusplus
for (let index = 0; index < 100; index++) {
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
  Row,
  filters: [
    {
      id: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      id: 'kind',
      type: 'text',
      label: 'Kind',
    },
    {
      id: 'labels',
      type: 'text',
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
  globalActions: {
    actions: [
      <Button key="first" onClick={() => 'Some action'}>
        Some action
      </Button>,
      {
        label: 'Or objects',
        onClick: () => 'Another action',
      },
      'or plain string',
    ],
  },
  onFilter: undefined,
  onSelect: () => null,
  scrollNode: undefined,
  emptyStateDescription: 'No matching data found...',
  virtualized: false,
};
