import * as React from 'react';
import { mockPluginManifest, mockPluginEntryModule } from '../test-mocks';
import PluginInfoTable from './PluginInfoTable';

describe('PluginInfoTable', () => {
  beforeEach(() => {
    cy.mount(<PluginInfoTable />);
  });

  it('Shows plugin runtime information', () => {
    cy.getPluginStore().then((pluginStore) => {
      pluginStore.addPendingPlugin(mockPluginManifest({ name: 'test-3' }));
      pluginStore.addLoadedPlugin(mockPluginManifest({ name: 'test-2' }), mockPluginEntryModule());
      pluginStore.addFailedPlugin(mockPluginManifest({ name: 'test-1' }), 'Test error message');
    });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .eq(0)
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test-1');
        cy.get('td[data-label="Status"]').should('contain.text', 'failed');
      });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .eq(1)
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test-2');
        cy.get('td[data-label="Status"]').should('contain.text', 'loaded');
      });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .eq(2)
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test-3');
        cy.get('td[data-label="Status"]').should('contain.text', 'pending');
      });
  });

  it('Allows to manually disable a loaded plugin', () => {
    cy.getPluginStore().then((pluginStore) => {
      pluginStore.addLoadedPlugin(mockPluginManifest({ name: 'test' }), mockPluginEntryModule());
      pluginStore.enablePlugins(['test']);
    });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test');
        cy.get('td[data-label="Status"]').should('contain.text', 'loaded');
        cy.get('td[data-label="Enabled"]').should('contain.text', 'Yes');
      });

    cy.getPluginStore().then((pluginStore) => {
      const entry = pluginStore.getPluginInfo()[0];

      cy.wrap(entry).its('status').should('equal', 'loaded');
      cy.wrap(entry).its('enabled').should('be.true');
    });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .within(() => {
        cy.get('td[data-label="Actions"] button').contains('Disable').click();
      });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test');
        cy.get('td[data-label="Status"]').should('contain.text', 'loaded');
        cy.get('td[data-label="Enabled"]').should('contain.text', 'No');
      });

    cy.getPluginStore().then((pluginStore) => {
      const entry = pluginStore.getPluginInfo()[0];

      cy.wrap(entry).its('status').should('equal', 'loaded');
      cy.wrap(entry).its('enabled').should('be.false');
    });
  });

  it('Allows plugins to eat burgers for lunch (via custom plugin info)', () => {
    cy.getPluginStore().then((pluginStore) => {
      pluginStore.addLoadedPlugin(mockPluginManifest({ name: 'test' }), mockPluginEntryModule());
      pluginStore.enablePlugins(['test']);
    });

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'test');
        cy.get('td[data-label="Status"]').should('contain.text', 'loaded');
        cy.get('td[data-label="Lunch"]').should('contain.text', '');
        cy.get('[data-testid="actions-column"] button').click();
        cy.get('button').contains('Have burger for lunch').click();
        cy.get('td[data-label="Lunch"]').should('contain.text', 'burger');
      });

    cy.getPluginStore().then((pluginStore) => {
      const entry = pluginStore.getPluginInfo()[0];

      cy.wrap(entry).its('customInfo.lunch').should('equal', 'burger');
    });
  });
});
