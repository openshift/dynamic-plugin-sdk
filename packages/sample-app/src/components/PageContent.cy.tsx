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

      const entryModule = mockPluginEntryModule({
        FooModule: { default: cy.spy().as('fooListener') },
        BarModule: { fizz: cy.spy().as('barListener') },
      });

      pluginStore.addLoadedPlugin(manifest, entryModule);
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
