/* eslint-disable no-undef */

describe('test contact', () => {

    before('login', () => {
        cy.doLogin();
    });

    it('passes', () => {
        cy.visit('../contact');
        cy.get('.xh-spinner').should('not.exist');
        cy.getByTestId('button-details').click();

        cy.contains('Don Febbraio').should('exist');
        cy.contains('Anselm McClain').should('exist');

        cy.getByTestId('filter').type('Anselm');

        cy.contains('Don Febbraio').should('not.exist');
        cy.contains('Anselm McClain').should('exist');

        cy.getByTestId('button-faces').click();

        cy.contains('Don Febbraio').should('not.exist');
        cy.contains('Anselm McClain').should('exist');

        cy.getByTestId('filter').type('{backspace}');

        cy.contains('Don Febbraio').should('exist');
        cy.contains('Anselm McClain').should('exist');

    });
});