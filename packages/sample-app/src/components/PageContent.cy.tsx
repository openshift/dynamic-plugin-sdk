import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { mockLocalPluginManifest } from '../test-mocks';
import { RenderExtensions } from './PageContent';

describe('RenderExtensions', () => {
  beforeEach(() => {
    cy.mount(<RenderExtensions />);
  });

  it('Invokes all telemetry listener functions', () => {
    cy.getPluginStore().then((pluginStore) => {
      const fooListener = cy.spy().as('fooListener');
      const barListener = cy.spy().as('barListener');

      const manifest = mockLocalPluginManifest({
        name: 'test',
        extensions: [
          {
            type: 'core.telemetry/listener',
            properties: {
              listener: applyCodeRefSymbol(() => Promise.resolve(fooListener)),
            },
          },
          {
            type: 'core.telemetry/listener',
            properties: {
              listener: applyCodeRefSymbol(() => Promise.resolve(barListener)),
            },
          },
        ],
      });

      const loadedExtensions: LoadedExtension[] = manifest.extensions.map((e, index) => ({
        ...e,
        pluginName: manifest.name,
        uid: `${manifest.name}[${index}]`,
      }));

      pluginStore.addLoadedPlugin(manifest, loadedExtensions);
      pluginStore.enablePlugins(['test']);
    });

    cy.get('[data-test-id="extension-card"]')
      .should('have.length', 2)
      .each((element) => {
        cy.wrap(element).should('contain.text', 'core.telemetry/listener');
      });

    cy.get('@fooListener').should('be.calledWith', 'TestEvent');
    cy.get('@barListener').should('be.calledWith', 'TestEvent');
  });
});
