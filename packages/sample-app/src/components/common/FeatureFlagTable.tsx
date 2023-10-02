import { useFeatureFlag } from '@openshift/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as React from 'react';

const columnNames = {
  name: 'Feature flags',
  action: 'Action',
};

const FeatureFlagTable: React.FC = () => {
  const flagName = 'TELEMETRY_FLAG';
  const [flag, setFlag] = useFeatureFlag(flagName);

  const toggleFlag = React.useCallback(() => {
    setFlag(!flag);
  }, [flag, setFlag]);

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.action}</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td dataLabel={columnNames.name}>{flagName}</Td>
          <Td dataLabel={columnNames.action} modifier="fitContent">
            <Button variant="secondary" onClick={toggleFlag}>
              {flag ? 'Disable' : 'Enable'}
            </Button>
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

export default FeatureFlagTable;
