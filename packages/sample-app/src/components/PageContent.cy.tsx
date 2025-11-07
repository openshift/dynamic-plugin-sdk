import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import * as React from 'react';
import { mockPluginManifest, mockPluginEntryModule } from '../test-mocks';
import { RenderExtensions } from './PageContent';

describe('RenderExtensions', () => {
  beforeEach(() => {
    cy.mount(<RenderExtensions />);
  });

  it('Invokes all telemetry listener functions', () => {
    cy.getPluginStore().then((pluginStore) => {
      const manifest = mockPluginManifest({
        name: 'test',
        extensions: [
          {
            type: 'core.telemetry/listener',
            properties: {
              listener: { $codeRef: 'FooModule' },
            },
          },
          {
            type: 'core.telemetry/listener',
            properties: {
              listener: { $codeRef: 'BarModule.fizz' },
            },
          },
        ],
      });

      const fooListener = cy.spy().as('fooListener');
      const barListener = cy.spy().as('barListener');

      const entryModule = mockPluginEntryModule({
        FooModule: { default: fooListener },
        BarModule: { fizz: barListener },
      });

      const loadedExtensions: LoadedExtension[] = [
        {
          type: 'core.telemetry/listener',
          properties: {
            listener: applyCodeRefSymbol(() => Promise.resolve(fooListener)),
          },
          pluginName: 'test',
          uid: 'test[0]',
        },
        {
          type: 'core.telemetry/listener',
          properties: {
            listener: applyCodeRefSymbol(() => Promise.resolve(barListener)),
          },
          pluginName: 'test',
          uid: 'test[1]',
        },
      ];

      pluginStore.addLoadedPlugin(manifest, entryModule, loadedExtensions);
      pluginStore.enablePlugins(['test']);
    });

    cy.get('[data-ouia-component-type="PF4/Card"]')
      .should('have.length', 2)
      .each((element) => {
        cy.wrap(element).should('contain.text', 'core.telemetry/listener');
      });

    cy.get('@fooListener').should('be.calledWith', 'TestEvent');
    cy.get('@barListener').should('be.calledWith', 'TestEvent');
  });
});
