import {XH, hoistCmp, uses} from '@xh/hoist/core';
import {box, div, img, p, filler} from '@xh/hoist/cmp/layout';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {form} from '@xh/hoist/cmp/form';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {select, textArea, textInput} from '@xh/hoist/mobile/cmp/input';
import {button} from '@xh/hoist/mobile/cmp/button';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {isEmpty, get} from 'lodash';

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
            item: currentRecord ? contactProfile() : null,
            bbar: bbar()
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

const bbar = hoistCmp.factory<ContactDetailsModel>(({model}) => {
    const {currentRecord, isEditing} = model;
    if (!currentRecord) return null;

    return toolbar(
        button({
            text: 'Cancel',
            omit: !isEditing,
            onClick: () => model.cancelEdit()
        }),
        favoriteButton({omit: isEditing}),
        filler(),
        editButton({omit: !XH.getUser().isHoistAdmin})
    );
});

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

//------------
// Buttons
//------------
const favoriteButton = hoistCmp.factory<ContactDetailsModel>(({model}) => {
    const {currentRecord} = model;
    const isFavorite = get(currentRecord, 'data.isFavorite');
    return button({
        text: 'Favorite',
        icon: Icon.favorite({
            color: isFavorite ? 'gold' : null,
            prefix: isFavorite ? 'fas' : 'far'
        }),
        width: 120,
        minimal: false,
        onClick: () => model.contactPageModel.toggleFavorite(currentRecord)
    });
});

const editButton = hoistCmp.factory<ContactDetailsModel>(({model}) => {
    const {isEditing} = model;
    return button({
        icon: isEditing ? Icon.save() : Icon.edit(),
        text: isEditing ? 'Save' : 'Edit',
        intent: isEditing ? 'primary' : null,
        minimal: !isEditing,
        onClick: () => model.toggleEditAsync()
    });
});
