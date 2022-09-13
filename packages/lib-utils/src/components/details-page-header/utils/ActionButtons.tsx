import { Button, Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import React from 'react';

export type ActionButtonProp = {
  label: string;
  callback: (event: React.MouseEvent) => void;
  isDisabled?: boolean;
  tooltip?: string;
};

export type ActionButtonsProps = {
  actionButtons: ActionButtonProp[];
};

export const ActionButtons: React.SFC<ActionButtonsProps> = ({ actionButtons }) => (
  <Flex>
    {_.map(actionButtons, (actionButton, i) => {
      if (!_.isEmpty(actionButton)) {
        return (
          <FlexItem key={i}>
            {actionButton.tooltip ? (
              <Tooltip content={actionButton.tooltip}>
                <Button
                  variant="primary"
                  onClick={actionButton.callback}
                  isAriaDisabled={actionButton.isDisabled}
                >
                  {actionButton.label}
                </Button>
              </Tooltip>
            ) : (
              <Button
                variant="primary"
                onClick={actionButton.callback}
                isAriaDisabled={actionButton.isDisabled}
              >
                {actionButton.label}
              </Button>
            )}
          </FlexItem>
        );
      }
      return null;
    })}
  </Flex>
);

export default ActionButtons;
