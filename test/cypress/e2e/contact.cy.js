/* eslint-disable no-undef */

describe('test contact', () => {

    before('login', () => {
        cy.doLogin();

        cy.visit('../contact');
        cy.shouldPageLoaded();
    });

    xit('filtering', () => {
        // Make sure you are in the proper initial state
        cy.getByTestId('button-details').click();
        cy.getByTestId('filter').type('{backspace}');

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