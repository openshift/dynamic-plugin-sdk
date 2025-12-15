import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { mockLocalPluginManifest } from '../test-mocks';
import { RenderExtensions } from './PageContent';

describe('RenderExtensions', () => {
  beforeEach(() => {
    cy.mount(<RenderExtensions />);
  });

  it('Renders sample-app.text extensions', () => {
    cy.getPluginStore().then((pluginStore) => {
      const manifest = mockLocalPluginManifest({
        name: 'test',
        extensions: [
          {
            type: 'sample-app.text',
            properties: {
              text: 'Hello from extension 1',
            },
          },
          {
            type: 'sample-app.text',
            properties: {
              text: 'Hello from extension 2',
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

    cy.get('[data-test-id="extension-card-title"]')
      .should('have.length', 2)
      .each((element) => {
        cy.wrap(element).should('contain.text', 'sample-app.text');
      });

    cy.get('[data-test-id="extension-card-body"]')
      .first()
      .should('contain.text', 'Hello from extension 1');
    cy.get('[data-test-id="extension-card-body"]')
      .last()
      .should('contain.text', 'Hello from extension 2');

    cy.get('[data-test-id="extension-card-footer"]')
      .should('have.length', 2)
      .each((element) => {
        cy.wrap(element).should('contain.text', 'Contributed by test');
      });
  });
});
