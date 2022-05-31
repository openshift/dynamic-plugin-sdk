import { usePluginStore } from '@openshift/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { TableComposable, TableText, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as React from 'react';
import { setFlagForSampleApp, getFlagForSampleApp, getFlagsForSampleApp } from './AppFeatureFlags';

const columnNames = {
  actions: 'Actions',
  featureFlags: 'Feature flags',
};

const FeatureFlagTable: React.FC = () => {
  const pluginStore = usePluginStore();
  const flags: { [key: string]: boolean } = getFlagsForSampleApp();
  const [actionButtonLabels, setActionButtonLabels] = React.useState<{ [key: string]: string }>(
    Object.fromEntries(
      Object.entries(flags).map(([flag, value]) => [flag, value ? 'Disable' : 'Enable']),
    ),
  );

  const toggleFeatureFlag = (flag: string) => {
    const featureFlags: { [key: string]: boolean } = getFlagsForSampleApp();
    setFlagForSampleApp(flag, !featureFlags[flag]);
    setActionButtonLabels((prevState) => ({
      ...prevState,
      [flag]: getFlagForSampleApp(flag) ? 'Disable' : 'Enable',
    }));
    // TELEMETRY_FLAG is used to gate the telemetryListener extension
    pluginStore.updateExtensions();
  };

  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.featureFlags}</Th>
          <Th>{columnNames.actions}</Th>
          <Td />
        </Tr>
      </Thead>
      <Tbody>
        {Object.keys(flags).map((flag) => (
          <Tr>
            <Td dataLabel={columnNames.featureFlags}>{flag}</Td>
            <Td dataLabel={columnNames.actions}>
              <TableText>
                <Button variant="secondary" onClick={() => toggleFeatureFlag(flag)}>
                  {actionButtonLabels[flag]}
                </Button>
              </TableText>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default FeatureFlagTable;
