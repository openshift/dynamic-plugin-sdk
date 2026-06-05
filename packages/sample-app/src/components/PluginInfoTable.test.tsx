import { PluginStoreProvider, TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { mockLocalPluginManifest } from '../test-mocks';
import PluginInfoTable from './PluginInfoTable';

function renderWithPluginStore(ui: ReactElement) {
  const pluginStore = new TestPluginStore();
  const result = render(
    <PluginStoreProvider store={pluginStore}>{ui}</PluginStoreProvider>,
  );
  return { ...result, pluginStore };
}

describe('PluginInfoTable', () => {
  it('Shows plugin runtime information', () => {
    const { pluginStore } = renderWithPluginStore(<PluginInfoTable />);

    act(() => {
      pluginStore.addPendingPlugin(mockLocalPluginManifest({ name: 'test-3' }));
      pluginStore.addLoadedPlugin(mockLocalPluginManifest({ name: 'test-2' }), []);
      pluginStore.addFailedPlugin(mockLocalPluginManifest({ name: 'test-1' }), 'Boom!');
    });

    const table = screen.getByTestId('plugin-table');
    const rows = within(table).getAllByRole('row');

    // Plugins are sorted alphabetically: test-1 (failed), test-2 (loaded), test-3 (pending)
    expect(within(rows[1]).getByText('test-1')).toBeInTheDocument();
    expect(within(rows[1]).getByText('failed')).toBeInTheDocument();

    expect(within(rows[2]).getByText('test-2')).toBeInTheDocument();
    expect(within(rows[2]).getByText('loaded')).toBeInTheDocument();

    expect(within(rows[3]).getByText('test-3')).toBeInTheDocument();
    expect(within(rows[3]).getByText('pending')).toBeInTheDocument();
  });

  it('Allows to manually disable a loaded plugin', async () => {
    const user = userEvent.setup();
    const { pluginStore } = renderWithPluginStore(<PluginInfoTable />);

    act(() => {
      pluginStore.addLoadedPlugin(mockLocalPluginManifest({ name: 'test' }), []);
      pluginStore.enablePlugins(['test']);
    });

    const table = screen.getByTestId('plugin-table');
    const rows = within(table).getAllByRole('row');

    expect(within(rows[1]).getByText('test')).toBeInTheDocument();
    expect(within(rows[1]).getByText('loaded')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Yes')).toBeInTheDocument();

    const entry = pluginStore.getPluginInfo()[0];
    expect(entry.status).toBe('loaded');
    if (entry.status === 'loaded') {
      expect(entry.enabled).toBe(true);
    }

    await user.click(within(rows[1]).getByRole('button', { name: 'Disable' }));

    const updatedRows = within(table).getAllByRole('row');
    expect(within(updatedRows[1]).getByText('test')).toBeInTheDocument();
    expect(within(updatedRows[1]).getByText('loaded')).toBeInTheDocument();
    expect(within(updatedRows[1]).getByText('No')).toBeInTheDocument();

    const updatedEntry = pluginStore.getPluginInfo()[0];
    expect(updatedEntry.status).toBe('loaded');
    if (updatedEntry.status === 'loaded') {
      expect(updatedEntry.enabled).toBe(false);
    }
  });
});
