/* eslint-disable no-undef */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//


Cypress.Commands.add('getByTestId', (selector, ...args) => {
    return cy.get(`[data-test-id=${selector}]`, ...args);
});

Cypress.Commands.add('getInputByField', (selector, ...args) => {
    return cy.get(`[data-field-id=${selector}] input`, ...args);
});

Cypress.Commands.add('getTargetByTabId', (selector, ...args) => {
    return cy.get(`[data-tab-id=${selector}] > span > span`, ...args);
});

// Requires command line argument " --env username='FOO',password='BAR' "
Cypress.Commands.add('doLogin', () => {
    cy.visit('/');
    cy.get('.xh-spinner').should('not.exist');

    cy.url().then(url => {
        cy.log(url);
        if (url.includes('login')) {
            cy.get('input[id=username]').should('exist');
            cy.get('input[id=username]').type(Cypress.env('username'));
            cy.get('input[id=password]').type(`${Cypress.env('password')}{enter}`);
        }
    });

    cy.get('.xh-spinner').should('not.exist');
    cy.url().should('include', 'http://localhost:3000/app');
    cy.get('[class="tb-welcome-widget__greeting"] p:first').should('contain.text', `Welcome, `);
});