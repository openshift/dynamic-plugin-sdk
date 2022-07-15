import { usePluginStore, usePluginInfo } from '@openshift/dynamic-plugin-sdk';
import type { LoadedPluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Flex,
  FlexItem,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import { ModuleIcon, InfoCircleIcon } from '@patternfly/react-icons';
import { TableComposable, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
// eslint-disable-next-line camelcase
import { global_info_color_100 } from '@patternfly/react-tokens';
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

type PluginEnabledStatusProps = {
  infoEntry: LoadedPluginInfoEntry;
};

const PluginEnabledStatus: React.FC<PluginEnabledStatusProps> = ({ infoEntry }) => (
  <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
    <FlexItem>{infoEntry.enabled ? 'Yes' : 'No'}</FlexItem>
    {!infoEntry.enabled && infoEntry.disableReason && (
      <FlexItem>
        <Tooltip content={infoEntry.disableReason}>
          <InfoCircleIcon color={global_info_color_100.var} />
        </Tooltip>
      </FlexItem>
    )}
  </Flex>
);

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
          <Th width={20}>{columnNames.actions}</Th>
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
                {entry.status === 'loaded' ? <PluginEnabledStatus infoEntry={entry} /> : '-'}
              </Td>
              <Td dataLabel={columnNames.actions}>
                {entry.status === 'loaded' ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      entry.enabled
                        ? pluginStore.disablePlugins([entry.pluginName], 'Disabled by user')
                        : pluginStore.enablePlugins([entry.pluginName])
                    }
                  >
                    {entry.enabled ? actionButtonLabels.disable : actionButtonLabels.enable}
                  </Button>
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
