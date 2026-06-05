import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { PluginStoreProvider, TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { render, screen, act } from '@testing-library/react';
import { mockLocalPluginManifest } from '../test-mocks';
import { RenderExtensions } from './PageContent';

describe('RenderExtensions', () => {
  it('Renders sample-app.text extensions', () => {
    const pluginStore = new TestPluginStore();

    render(
      <PluginStoreProvider store={pluginStore}>
        <RenderExtensions />
      </PluginStoreProvider>,
    );

    const manifest = mockLocalPluginManifest({
      name: 'test',
      extensions: [
        {
          type: 'sample-app.text',
          properties: { text: 'Hello from extension 1' },
        },
        {
          type: 'sample-app.text',
          properties: { text: 'Hello from extension 2' },
        },
      ],
    });

    const loadedExtensions: LoadedExtension[] = manifest.extensions.map((e, index) => ({
      ...e,
      pluginName: manifest.name,
      uid: `${manifest.name}[${index}]`,
    }));

    act(() => {
      pluginStore.addLoadedPlugin(manifest, loadedExtensions);
      pluginStore.enablePlugins(['test']);
    });

    const titles = screen.getAllByTestId('extension-card-title');
    expect(titles).toHaveLength(2);
    titles.forEach((title) => {
      expect(title).toHaveTextContent('sample-app.text');
    });

    const bodies = screen.getAllByTestId('extension-card-body');
    expect(bodies[0]).toHaveTextContent('Hello from extension 1');
    expect(bodies[1]).toHaveTextContent('Hello from extension 2');

    const footers = screen.getAllByTestId('extension-card-footer');
    expect(footers).toHaveLength(2);
    footers.forEach((footer) => {
      expect(footer).toHaveTextContent('Contributed by test');
    });
  });
});
