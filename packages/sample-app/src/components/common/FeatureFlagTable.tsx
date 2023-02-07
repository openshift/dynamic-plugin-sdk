import { useFeatureFlag } from '@openshift/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { TableComposable, TableText, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as React from 'react';

const columnNames = {
  action: 'Action',
  featureFlags: 'Feature flags',
};

const actionLabels = {
  enable: 'Enable',
  disable: 'Disable',
};

const FeatureFlagTable: React.FC = () => {
  const flagName = 'TELEMETRY_FLAG';
  const [flag, setFlag] = useFeatureFlag(flagName);

  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.featureFlags}</Th>
          <Th>{columnNames.action}</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td dataLabel={columnNames.featureFlags}>{flagName}</Td>
          <Td dataLabel={columnNames.action} modifier="fitContent">
            <TableText>
              <Button variant="secondary" onClick={() => setFlag(!flag)}>
                {flag ? actionLabels.disable : actionLabels.enable}
              </Button>
            </TableText>
          </Td>
        </Tr>
      </Tbody>
    </TableComposable>
  );
};

export default FeatureFlagTable;
