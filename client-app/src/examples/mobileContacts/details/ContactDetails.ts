import {hoistCmp, uses} from '@xh/hoist/core';
import {box, div, img, p} from '@xh/hoist/cmp/layout';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {form} from '@xh/hoist/cmp/form';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {select, textArea, textInput} from '@xh/hoist/mobile/cmp/input';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';

import ContactDetailsModel from './ContactDetailsModel';
import './ContactDetails.scss';

export const contactDetails = hoistCmp.factory({
    model: uses(ContactDetailsModel),
    render({model}) {
        const {currentRecord, visible} = model;

        return panel({
            className: `tb-mobile-contact-details-panel${visible ? '--details-visible' : ''}`,
            flex: 'none',
            position: 'absolute',
            title: currentRecord?.data.name,
            headerItems: [button({icon: Icon.close(), onClick: () => model.clearCurrentRecord()})],
            item: currentRecord ? contactProfile() : null
        });
    }
});

const contactProfile = hoistCmp.factory({
    render() {
        return div({
            className: 'tb-mobile-contact-details-panel__inner',
            items: [
                picture(),
                form({
                    fieldDefaults: {
                        inline: true,
                        labelWidth: 100
                    },
                    items: [
                        textField({field: 'name'}),
                        textField({field: 'email'}),
                        textField({field: 'location'}),
                        textField({field: 'workPhone'}),
                        textField({field: 'cellPhone'}),
                        tagsField(),
                        bioField()
                    ]
                })
            ]
        });
    }
});

const picture = hoistCmp.factory<ContactDetailsModel>(({model}) =>
    img({src: model.currentRecord.data.profilePicture})
);

//--------------
// FormFields
//--------------
const textField = hoistCmp.factory(({field}) =>
    formField({
        field,
        readonlyRenderer: val => val ?? '-',
        item: textInput()
    })
);

const bioField = hoistCmp.factory(() =>
    formField({
        field: 'bio',
        label: null,
        item: textArea({minHeight: 250}),
        readonlyRenderer: val => {
            return val ? div(val.split('\n').map(v => p(v))) : '-';
        }
    })
);

const tagsField = hoistCmp.factory<ContactDetailsModel>(({model}) =>
    formField({
        field: 'tags',
        item: select({
            enableCreate: true,
            options: model.contactPageModel.tagList
        }),
        readonlyRenderer: tags => {
            return isEmpty(tags)
                ? 'None (yet)'
                : box({
                      flexWrap: 'wrap',
                      items: tags.map(tag => div({className: 'tb-contact-tag', item: tag}))
                  });
        }
    })
);
