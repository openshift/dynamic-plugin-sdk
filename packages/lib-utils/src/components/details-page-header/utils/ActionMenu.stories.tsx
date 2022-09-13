/* eslint-disable react/jsx-props-no-spreading */
import { DropdownPosition } from '@patternfly/react-core';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { ActionMenu } from './ActionMenu';

const meta: ComponentMeta<typeof ActionMenu> = {
  title: 'ActionMenu',
  component: ActionMenu,
  argTypes: {},
};

export default meta;

const ActionMenuTemplate: ComponentStory<typeof ActionMenu> = (args) => {
  return <ActionMenu {...args} />;
};

export const Actions = ActionMenuTemplate.bind({});

Actions.args = {
  actions: [
    {
      id: '1',
      label: 'Edit Action',
      cta: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
          // eslint-disable-next-line no-console
          console.log('Edit Action', event);
        },
      },
      tooltip: 'Sample tooltip',
    },
    {
      id: '2',
      label: 'Delete Action',
      cta: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
          // eslint-disable-next-line no-console
          console.log('Delete Action', event);
        },
      },
      isDisabled: true,
    },
  ],
  isDisabled: false,
  position: DropdownPosition.left,
};

export const GroupedActions = ActionMenuTemplate.bind({});

GroupedActions.args = {
  groupedActions: [
    {
      groupId: 'group1',
      groupActions: [
        {
          id: '1',
          label: 'Edit Action',
          cta: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
              // eslint-disable-next-line no-console
              console.log('Edit Action', event);
            },
          },
          tooltip: 'Sample tooltip',
        },
        {
          id: '2',
          label: 'Delete Action',
          cta: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
              // eslint-disable-next-line no-console
              console.log('Delete Action', event);
            },
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
  ],
  position: DropdownPosition.left,
};
