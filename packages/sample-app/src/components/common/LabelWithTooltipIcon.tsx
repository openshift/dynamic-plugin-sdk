import { Flex, FlexItem, Icon, Tooltip } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';

type LabelWithTooltipIconProps = {
  label: React.ReactNode;
  tooltipContent?: React.ReactNode;
};

const LabelWithTooltipIcon: React.FC<LabelWithTooltipIconProps> = ({ label, tooltipContent }) => {
  if (!tooltipContent) {
    return <>{label}</>;
  }

  return (
    <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>{label}</FlexItem>
      <FlexItem>
        <Tooltip content={tooltipContent}>
          <Icon status="info">
            <InfoCircleIcon />
          </Icon>
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};

export default LabelWithTooltipIcon;
