import { useFeatureFlag } from '@openshift/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { TableComposable, TableText, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as React from 'react';

const columnNames = {
  action: 'Action',
  featureFlags: 'Feature flags',
};

const FeatureFlagTable: React.FC = () => {
  const flagName = 'TELEMETRY_FLAG';
  const [flag, setFlag] = useFeatureFlag(flagName);

  const [actionButtonLabel, setActionButtonLabel] = React.useState<string>(
    flag ? 'Disable' : 'Enable',
  );

  const toggleFeatureFlag = () => {
    setFlag(!flag);
    setActionButtonLabel(!flag ? 'Disable' : 'Enable');
  };

  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.featureFlags}</Th>
          <Th>{columnNames.action}</Th>
          <Td />
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td dataLabel={columnNames.featureFlags}>{flagName}</Td>
          <Td dataLabel={columnNames.action}>
            <TableText>
              <Button variant="secondary" onClick={() => toggleFeatureFlag()}>
                {actionButtonLabel}
              </Button>
            </TableText>
          </Td>
        </Tr>
      </Tbody>
    </TableComposable>
  );
};

export default FeatureFlagTable;
