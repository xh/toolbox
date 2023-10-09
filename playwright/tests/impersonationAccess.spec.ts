import {test} from '../fixtures/toolbox';

test('User Access Levels ', async ({tb}) => {
    await tb.page.goto(`localhost:3000/admin`);
    await tb.expectVisible({text: 'About this Application'});
    await tb.click('general-tab-switcher-config');
    await tb.waitForMaskToClear()
    await tb.configGrid.dblClickRow({name: 'auth0ClientId'})
    await tb.fill('config-form-name', 'hello')
    await tb.expectValue('config-form-name-input', 'hello')

    await tb.impersonate('ro-admin@xh.io')
    await tb.configGrid.dblClickRow({name: 'auth0ClientId'})
    const configForm = tb.createFormHelper('config-form')
    if(!configForm.isFieldReadOnly('name')) throw new Error('Field is not read only. Check ro-admin@xh.io access.')
    await tb.expectText('config-form-name-readonly-display', 'auth0ClientId')


    await tb.impersonate('user@xh.io')
    await tb.expectVisible({text:'HOIST_ADMIN_READER'})
});
