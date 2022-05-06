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

const columnNames = {
  name: 'Name',
  status: 'Status',
  version: 'Version',
  enabled: 'Enabled',
  actions: 'Actions',
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

  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.status}</Th>
          <Th>{columnNames.version}</Th>
          <Th info={{ tooltip: columnTooltips.enabled }}>{columnNames.enabled}</Th>
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
              <Td dataLabel={columnNames.actions} modifier="fitContent">
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
            </Tr>
          ))
        )}
      </Tbody>
    </TableComposable>
  );
};

export default PluginInfoTable;
