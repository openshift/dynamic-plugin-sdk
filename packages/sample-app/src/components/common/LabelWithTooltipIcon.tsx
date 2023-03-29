import { Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
// eslint-disable-next-line camelcase
import { global_info_color_100 } from '@patternfly/react-tokens';
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
          <InfoCircleIcon color={global_info_color_100.var} />
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};

export default LabelWithTooltipIcon;
