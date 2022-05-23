import { usePluginStore, usePluginInfo } from '@openshift/dynamic-plugin-sdk';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core';
import { ModuleIcon } from '@patternfly/react-icons';
import { TableComposable, TableText, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as React from 'react';
import { setFlagsForSampleApp, getFlagsForSampleApp } from './AppFeatureFlags';

const columnNames = {
  name: 'Name',
  status: 'Status',
  version: 'Version',
  enabled: 'Enabled',
  actions: 'Actions',
  featureFlags: 'Feature flags',
};

const columnTooltips = {
  enabled: 'Enabling a plugin puts all of its extensions into use. Disabling it does the opposite.',
};

const actionButtonLabels = {
  enable: 'Enable',
  disable: 'Disable',
};

const enabledText = (value: boolean) => (value ? 'Yes' : 'No');

const PluginInfoTable: React.FC = () => {
  const pluginStore = usePluginStore();
  const infoEntries = usePluginInfo().sort((a, b) => a.pluginName.localeCompare(b.pluginName));
  const [featureFlagButtonTitle, setfeatureFlagButtonTitle] = React.useState(
    getFlagsForSampleApp().includes('TELEMETRY_FLAG')
      ? 'Turn off TELEMETRY_FLAG'
      : 'Turn on TELEMETRY_FLAG',
  );
  const toggleTelemetryFeatureFlag = () => {
    const featureFlags: string[] = getFlagsForSampleApp();
    if (featureFlags.includes('TELEMETRY_FLAG')) {
      setFlagsForSampleApp(featureFlags.filter((f) => f !== 'TELEMETRY_FLAG'));
      setfeatureFlagButtonTitle('Turn on TELEMETRY_FLAG');
    } else {
      featureFlags.push('TELEMETRY_FLAG');
      setFlagsForSampleApp(featureFlags);
      setfeatureFlagButtonTitle('Turn off TELEMETRY_FLAG');
    }
    // TELEMETRY_FLAG is used to gate the telemetryListener extension
    pluginStore.updateExtensions();
  };

  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.status}</Th>
          <Th>{columnNames.version}</Th>
          <Th info={{ tooltip: columnTooltips.enabled }}>{columnNames.enabled}</Th>
          <Th>{columnNames.actions}</Th>
          <Th>{columnNames.featureFlags}</Th>
          <Td />
        </Tr>
      </Thead>
      <Tbody>
        {infoEntries.length === 0 ? (
          <Tr>
            <Td colSpan={Object.keys(columnNames).length}>
              <Bullseye>
                <EmptyState>
                  <EmptyStateIcon icon={ModuleIcon} />
                  <Title headingLevel="h2" size="md">
                    No plugins detected
                  </Title>
                  <EmptyStateBody>
                    Check browser console for errors if plugins don&apos;t show up here.
                  </EmptyStateBody>
                </EmptyState>
              </Bullseye>
            </Td>
          </Tr>
        ) : (
          infoEntries.map((entry) => (
            <Tr key={entry.pluginName}>
              <Td dataLabel={columnNames.name}>{entry.pluginName}</Td>
              <Td dataLabel={columnNames.status}>{entry.status}</Td>
              <Td dataLabel={columnNames.version}>
                {entry.status === 'loaded' ? entry.metadata.version : '-'}
              </Td>
              <Td dataLabel={columnNames.enabled}>
                {entry.status === 'loaded' ? enabledText(entry.enabled) : '-'}
              </Td>
              <Td dataLabel={columnNames.actions}>
                {entry.status === 'loaded' ? (
                  <TableText>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        pluginStore.setPluginsEnabled([
                          {
                            pluginName: entry.pluginName,
                            enabled: !entry.enabled,
                          },
                        ])
                      }
                    >
                      {entry.enabled ? actionButtonLabels.disable : actionButtonLabels.enable}
                    </Button>
                  </TableText>
                ) : null}
              </Td>
              <Td>
                {entry.status === 'loaded' && entry.enabled && (
                  <Button variant="secondary" onClick={toggleTelemetryFeatureFlag}>
                    {featureFlagButtonTitle}
                  </Button>
                )}
              </Td>
            </Tr>
          ))
        )}
      </Tbody>
    </TableComposable>
  );
};

export default PluginInfoTable;
