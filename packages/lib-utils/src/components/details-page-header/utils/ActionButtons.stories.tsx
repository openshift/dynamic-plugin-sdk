/* eslint-disable react/jsx-props-no-spreading */
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { ActionButtons } from './ActionButtons';

const meta: ComponentMeta<typeof ActionButtons> = {
  title: 'ActionButtons',
  component: ActionButtons,
  argTypes: {},
};

export default meta;

const ActionButtonsTemplate: ComponentStory<typeof ActionButtons> = (args) => {
  return <ActionButtons {...args} />;
};

export const Actions = ActionButtonsTemplate.bind({});

Actions.args = {
  actionButtons: [
    {
      label: 'Edit Workspace',
      callback: (event: React.MouseEvent) => {
        // eslint-disable-next-line no-console
        console.log('Edit Workspace', event);
      },
    },
    {
      label: 'Delete Workspace',
      callback: (event: React.MouseEvent) => {
        // eslint-disable-next-line no-console
        console.log('Delete Workspace', event);
      },
      isDisabled: true,
    },
  ],
};
