import { usePluginStore, usePluginInfo } from '@openshift/dynamic-plugin-sdk';
import type { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core';
import { ModuleIcon } from '@patternfly/react-icons';
import { ActionsColumn, TableComposable, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import type { IAction } from '@patternfly/react-table';
import * as React from 'react';
import LabelWithTooltipIcon from './LabelWithTooltipIcon';

const columnNames = {
  name: 'Name',
  version: 'Version',
  status: 'Status',
  extensions: 'Extensions',
  enabled: 'Enabled',
  actions: 'Actions',
};

const columnTooltips = {
  enabled: 'Enabling a plugin puts all of its extensions into use. Disabling it does the opposite.',
};

const getDropdownActions = (entry: PluginInfoEntry): IAction[] => [
  {
    title: 'Log plugin manifest',
    // eslint-disable-next-line no-console
    onClick: () => console.log(`${entry.manifest.name} manifest`, entry.manifest),
  },
];

const PluginInfoTable: React.FC = () => {
  const pluginStore = usePluginStore();
  const entries = usePluginInfo().sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

  return (
    <TableComposable variant="compact" data-test-id="plugin-table">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.version}</Th>
          <Th>{columnNames.status}</Th>
          <Th>{columnNames.extensions}</Th>
          <Th info={{ tooltip: columnTooltips.enabled }}>{columnNames.enabled}</Th>
          <Th>{columnNames.actions}</Th>
          <Td />
        </Tr>
      </Thead>
      <Tbody>
        {entries.length === 0 ? (
          <Tr>
            <Td colSpan={7}>
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
          entries.map((p) => {
            const statusTooltip = p.status === 'failed' ? p.errorMessage : null;
            const enabledLabel = p.status === 'loaded' && p.enabled ? 'Yes' : 'No';
            const enabledTooltip = p.status === 'loaded' && !p.enabled ? p.disableReason : null;
            const toggleEnabledText = p.status === 'loaded' && p.enabled ? 'Disable' : 'Enable';

            const togglePluginEnabled = () => {
              if (p.status === 'loaded') {
                if (p.enabled) {
                  pluginStore.disablePlugins([p.manifest.name], 'Disabled by user');
                } else {
                  pluginStore.enablePlugins([p.manifest.name]);
                }
              }
            };

            return (
              <Tr key={p.manifest.name}>
                <Td dataLabel={columnNames.name}>{p.manifest.name}</Td>
                <Td dataLabel={columnNames.version}>{p.manifest.version}</Td>
                <Td dataLabel={columnNames.status}>
                  <LabelWithTooltipIcon label={p.status} tooltipContent={statusTooltip} />
                </Td>
                <Td dataLabel={columnNames.extensions}>{p.manifest.extensions.length}</Td>
                <Td dataLabel={columnNames.enabled}>
                  <LabelWithTooltipIcon label={enabledLabel} tooltipContent={enabledTooltip} />
                </Td>
                <Td dataLabel={columnNames.actions} modifier="fitContent">
                  <Button
                    isDisabled={p.status !== 'loaded'}
                    variant="secondary"
                    onClick={togglePluginEnabled}
                  >
                    {toggleEnabledText}
                  </Button>
                </Td>
                <Td isActionCell>
                  <ActionsColumn items={getDropdownActions(p)} />
                </Td>
              </Tr>
            );
          })
        )}
      </Tbody>
    </TableComposable>
  );
};

export default PluginInfoTable;
