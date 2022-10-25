import { Button, Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import React from 'react';

export type ActionButtonProp = {
  id?: string;
  label?: string;
  callback: (event: React.MouseEvent) => void;
  isDisabled?: boolean;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
};

export type ActionButtonsProps = {
  actionButtons: ActionButtonProp[];
};

const ActionButton: React.FC<ActionButtonProp> = ({
  id,
  children,
  callback,
  isDisabled,
  tooltip,
  variant = 'primary',
}) => {
  const tooltipRef = React.useRef();
  return (
    <>
      <Button
        variant={variant}
        onClick={callback}
        isAriaDisabled={isDisabled}
        aria-describedby={id}
        innerRef={tooltipRef}
      >
        {children}
      </Button>
      {tooltip ? <Tooltip id={id} content={tooltip} reference={tooltipRef} /> : null}
    </>
  );
};

export const ActionButtons: React.SFC<ActionButtonsProps> = ({ actionButtons }) => (
  <Flex>
    {_.map(actionButtons, (actionButton, i) => {
      if (!_.isEmpty(actionButton)) {
        return (
          <FlexItem key={actionButton.id || i}>
            <ActionButton
              variant={actionButton.variant}
              callback={actionButton.callback}
              isDisabled={actionButton.isDisabled}
              tooltip={actionButton.tooltip}
            >
              {actionButton.label}
            </ActionButton>
          </FlexItem>
        );
      }
      return null;
    })}
  </Flex>
);

export default ActionButtons;
