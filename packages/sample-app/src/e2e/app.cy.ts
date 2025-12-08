describe('Sample Plugin Host Application', () => {
  it('Loads the sample plugin', () => {
    cy.visit('/');

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody')
      .should('contain.text', 'No plugins detected');

    cy.get('[data-test-id="plugin-modal-open"]').should('have.text', 'Load remote plugin').click();

    cy.get('[data-test-id="plugin-modal-url"]').should(
      'have.value',
      'http://localhost:9001/plugin-manifest.json',
    );

    cy.get('[data-test-id="plugin-modal-load"]')
      .should('be.enabled')
      .should('have.text', 'Load')
      .click();

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody')
      .should('not.contain.text', 'No plugins detected');

    cy.get('[data-test-id="plugin-table"]')
      .find('tbody > tr')
      .should('have.length', 1)
      .within(() => {
        cy.get('td[data-label="Name"]').should('contain.text', 'sample-plugin');
        cy.get('td[data-label="Version"]').should('contain.text', '1.2.3');
        cy.get('td[data-label="Status"]').should('contain.text', 'loaded');
        cy.get('td[data-label="Extensions"]').should('contain.text', '2');
        cy.get('td[data-label="Enabled"]').should('contain.text', 'Yes');
      });
  });
});
