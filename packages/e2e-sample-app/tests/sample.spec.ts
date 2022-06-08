// <reference types="cypress" />

describe('Sample app', () => {
  it('displays a button to load plugins', () => {
    cy.visit('/app-minimal.html');
    cy.get('div.pf-c-toolbar__item > button.pf-c-button')
      .first()
      .should('have.text', 'Load plugin');
  });
});
