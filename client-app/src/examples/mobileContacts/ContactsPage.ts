import {hoistCmp, creates} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {hframe, filler} from '@xh/hoist/cmp/layout';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';

import tileView from './cmp/TileView';
import ContactsPageModel from './ContactsPageModel';
import {contactDetails} from './details/ContactDetails';

export const contactsPage = hoistCmp.factory({
    model: creates(ContactsPageModel),

    render({model}) {
        return panel({
            className: 'tb-directory-panel',
            item: hframe(
                panel({
                    tbar: tbar(),
                    item: model.displayMode === 'grid' ? grid() : tileView(),
                    bbar: bbar()
                }),
                contactDetails()
            )
        });
    }
});

const tbar = hoistCmp.factory<ContactsPageModel>(({model}) => {
    return toolbar({
        className: 'tb-directory-panel__tbar',
        items: [
            storeFilterField({
                leftIcon: Icon.search(),
                maxWidth: 400,
                minWidth: 200
            }),
            filler(),
            buttonGroupInput({
                bind: 'displayMode',
                outlined: true,
                intent: 'primary',
                items: [
                    button({
                        icon: Icon.list(),
                        value: 'grid',
                        width: 50
                    }),
                    button({
                        icon: Icon.users(),
                        value: 'tiles',
                        width: 50
                    })
                ]
            })
        ]
    });
});

const bbar = hoistCmp.factory<ContactsPageModel>(({model}) => {
    const {
        gridModel: {store}
    } = model;

    return toolbar(filler(), storeCountLabel({store, unit: 'contact'}));
});
