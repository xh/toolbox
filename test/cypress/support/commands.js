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

// A useful wait for if the hoist SWPA is loaded
// NOTE: This does NOT guarantee all components and data have been loaded, especially async methods
Cypress.Commands.add('shouldPageLoaded', () => {
    return cy.get('.xh-spinner', {timeout: 10000}).should('not.exist');
});

// Requires command line argument " --env username='FOO',password='BAR' "
Cypress.Commands.add('doLogin', () => {
    assert.exists(Cypress.env('username'), '"CYPRESS_username" not found')
    assert.exists(Cypress.env('password'), '"CYPRESS_password" not found')

    cy.visit('/');
    cy.shouldPageLoaded();

    cy.url().then(url => {
        cy.log(url);
        if (url.includes('login')) {
            cy.get('input[id=username]').should('exist');
            cy.get('input[id=username]').type(Cypress.env('username'));
            cy.get('input[id=password]').type(`${Cypress.env('password')}{enter}`);
        }
    });

    cy.shouldPageLoaded();
});