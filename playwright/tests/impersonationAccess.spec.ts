import {test} from '../fixtures/toolbox';

test('User Access Levels ', async ({admin}) => {
    await admin.page.goto(`localhost:3000/admin`);
    await admin.expectVisible({text: 'About this Application'});
    await admin.click('general-tab-switcher-config');
    await admin.waitForMaskToClear()
    await admin.configGrid.dblClickRow({name: 'auth0ClientId'})
    await admin.fill('config-form-name', 'hello')
    await admin.expectValue('config-form-name-input', 'hello')

    await admin.impersonate('ro-admin@xh.io')
    await admin.configGrid.dblClickRow({name: 'auth0ClientId'})
    const configForm = admin.createFormHelper('config-form')
    if(!configForm.isFieldReadOnly('name')) throw new Error('Field is not read only. Check ro-admin@xh.io access.')
    await admin.expectText('config-form-name-readonly-display', 'auth0ClientId')


    await admin.impersonate('user@xh.io', {waitForAppState: 'ACCESS_DENIED'})
    await admin.expectVisible({text: `User needs the role "HOIST_ADMIN_READER" to access this application.`})
});
