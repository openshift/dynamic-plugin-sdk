import { TestPluginStore, PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { mount } from 'cypress/react';
import * as React from 'react';
import '../app-styles';

declare global {
  // TODO(vojtech): suppress false positive https://github.com/typescript-eslint/typescript-eslint/pull/2238
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      getPluginStore(): Chainable<TestPluginStore>;
    }
  }
}

let pluginStore: TestPluginStore;

beforeEach(() => {
  pluginStore = new TestPluginStore();
});

Cypress.Commands.add('mount', (component, options = {}) => {
  return mount(<PluginStoreProvider store={pluginStore}>{component}</PluginStoreProvider>, options);
});

Cypress.Commands.add('getPluginStore', () => {
  return cy.wrap(pluginStore);
});
