/* eslint-disable no-undef */

describe('Test Toolbox', () => {

    before('login', () => {
        cy.doLogin();

        cy.visit('');
        cy.shouldPageLoaded();
        cy.get('[class="tb-welcome-widget__greeting"] p:first').should('contain.text', `Welcome, `);

    });

    it('grids', () => {
        cy.getTargetByTabId('grids').click();
        cy.getTargetByTabId('tree').click();
        cy.getTargetByTabId('columnFiltering').click();
        cy.getTargetByTabId('inlineEditing').click();
        cy.getTargetByTabId('dataview').click();
        cy.getTargetByTabId('treeWithCheckBox').click();
        cy.getTargetByTabId('groupedCols').click();
        cy.getTargetByTabId('rest').click();
        cy.getTargetByTabId('agGrid').click();
        cy.getTargetByTabId('standard').click();
    });

    it('panels', () => {

        cy.getTargetByTabId('panels').click();
        cy.getTargetByTabId('toolbars').click();
        cy.getTargetByTabId('sizing').click();
        cy.getTargetByTabId('mask').click();
        cy.getTargetByTabId('loadingIndicator').click();
        cy.getTargetByTabId('intro').click();
    });
    
    it('layout', () => {
        cy.getTargetByTabId('layout').click();
        cy.getTargetByTabId('vbox').click();
        cy.getTargetByTabId('tabPanel').click();
        cy.getTargetByTabId('dock').click();
        cy.getTargetByTabId('dashContainer').click();
        cy.getTargetByTabId('dashCanvas').click();
        cy.getTargetByTabId('tileFrame').click();
        cy.getTargetByTabId('hbox').click();
    });

    it('forms', () => {
        cy.getTargetByTabId('forms').click();
        cy.getTargetByTabId('inputs').click();
        cy.getTargetByTabId('toolbarForm').click();
        cy.getTargetByTabId('form').click();
    });

    it('charts', () => {
        cy.getTargetByTabId('charts').click();
        cy.getTargetByTabId('ohlc').click();
        cy.getTargetByTabId('line').click();
        cy.getTargetByTabId('simpleTreeMap').click();
        cy.getTargetByTabId('gridTreeMap').click();
        cy.getTargetByTabId('splitTreeMap').click();
    });

    it('mobile', () => {
        cy.getTargetByTabId('mobile').click();
    });

    it('other', () => {
        cy.getTargetByTabId('other').click();
        cy.getTargetByTabId('buttons').click();
        cy.getTargetByTabId('clock').click();
        cy.getTargetByTabId('customPackage').click();
        cy.getTargetByTabId('dateFormats').click();
        cy.getTargetByTabId('jsx').click();
        cy.getTargetByTabId('errorMessage').click();
        cy.getTargetByTabId('exceptionHandler').click();
        cy.getTargetByTabId('fileChooser').click();
        cy.getTargetByTabId('icons').click();
        cy.getTargetByTabId('leftRightChooser').click();
        cy.getTargetByTabId('numberFormats').click();
        cy.getTargetByTabId('pinPad').click();
        cy.getTargetByTabId('placeholder').click();
        cy.getTargetByTabId('popups').click();
        cy.getTargetByTabId('timestamp').click();
        cy.getTargetByTabId('appNotifications').click();
    });

    xit('examples', () => {
        cy.getTargetByTabId('examples').click();
        cy.getByTestId('contact').click();
        cy.getByTestId('todo').click();
        cy.getByTestId('news').click();
        cy.getByTestId('recalls').click();
        cy.getByTestId('fileManager').click();
        cy.getByTestId('portfolio').click();

        cy.getTargetByTabId('home').click();
    });
});