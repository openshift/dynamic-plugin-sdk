import * as React from 'react';
import { mockLocalPluginManifest } from '../test-mocks';
import PluginInfoTable from './PluginInfoTable';

describe('PluginInfoTable', () => {
  beforeEach(() => {
    cy.mount(<PluginInfoTable />);
  });

  it('Shows plugin runtime information', () => {
    cy.getPluginStore().then((pluginStore) => {
      pluginStore.addPendingPlugin(mockLocalPluginManifest({ name: 'test-3' }));
      pluginStore.addLoadedPlugin(mockLocalPluginManifest({ name: 'test-2' }), []);
      pluginStore.addFailedPlugin(mockLocalPluginManifest({ name: 'test-1' }), 'Boom!');
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
      pluginStore.addLoadedPlugin(mockLocalPluginManifest({ name: 'test' }), []);
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
});
