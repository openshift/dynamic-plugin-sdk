describe('Sample app', () => {
  it('displays a button to load plugins', () => {
    cy.visit('/app-minimal.html');
    cy.get('[data-test-id="load-plugin-button"]').should('have.text', 'Load plugin test');
  });
});
