import {XH, hoistCmp, creates} from '@xh/hoist/core';
import {box, div, img, p, filler} from '@xh/hoist/cmp/layout';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {form} from '@xh/hoist/cmp/form';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {select, textArea, textInput} from '@xh/hoist/mobile/cmp/input';
import {button} from '@xh/hoist/mobile/cmp/button';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {isEmpty, get} from 'lodash';

import DetailsPanelModel from './DetailsPanelModel';
import './DetailsPanelMobile.scss';

const detailsPanel = hoistCmp.factory({
    model: creates(() => DetailsPanelModel),
    render({model}) {

        return panel({
            className: 'tb-mobile-contact-details-panel',
            title: '',
            item: contactProfile(),
            bbar: bbar()
        });
    }
});

export default detailsPanel;

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

const picture = hoistCmp.factory<DetailsPanelModel>(({model}) =>
    img({src: model.currentRecord.data.profilePicture})
);

const bbar = hoistCmp.factory<DetailsPanelModel>(({model}) => {
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

const tagsField = hoistCmp.factory<DetailsPanelModel>(({model}) =>
    formField({
        field: 'tags',
        item: select({
            enableCreate: true,
            options: model.directoryPanelModel.tagList
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
const favoriteButton = hoistCmp.factory<DetailsPanelModel>(({model}) => {
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
        onClick: () => model.directoryPanelModel.toggleFavorite(currentRecord)
    });
});

const editButton = hoistCmp.factory<DetailsPanelModel>(({model}) => {
    const {isEditing} = model;
    return button({
        icon: isEditing ? Icon.save() : Icon.edit(),
        text: isEditing ? 'Save' : 'Edit',
        intent: isEditing ? 'primary' : null,
        minimal: !isEditing,
        onClick: () => model.toggleEditAsync()
    });
});
