import {hoistCmp, uses} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout/index';
import {FacebookModel} from './FacebookModel';
import {vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';

export const facebookLayout = hoistCmp.factory({
    model: uses(FacebookModel),

    render({model}) {
        console.log(model.contacts)
        return div({
            items: [...model.contacts.map(contact => vbox({
                height: 150,
                width: 100,
                alignItems: 'center',
                justifyContent: 'center',
                items: [
                    Icon.user({size: '2x'}),
                    div(contact.name),
                    div(contact.bio),
                    div(contact.email)
                ]
            }))]
        })
    }
})
