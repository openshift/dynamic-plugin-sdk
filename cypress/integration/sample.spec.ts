// <reference types="cypress" />

describe('example to-do app', () => {
  it('displays two todo items by default', () => {
    cy.visit('/app-minimal.html');
    cy.get('div.pf-c-toolbar__item > button.pf-c-button')
      .first()
      .should('have.text', 'Load plugin');
  });
});
