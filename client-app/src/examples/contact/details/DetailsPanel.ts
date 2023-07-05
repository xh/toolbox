import {form} from '@xh/hoist/cmp/form';
import {box, div, filler, img, p, placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {select, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon/Icon';
import {isEmpty} from 'lodash';
import './DetailsPanel.scss';
import {DetailsPanelModel} from './DetailsPanelModel';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),
    className: 'tb-contact-details-panel',

    render({model, className}) {
        const {currentRecord} = model,
            title = currentRecord?.data.name ?? null,
            icon = currentRecord ? Icon.detail() : null;

        return panel({
            modelConfig: {
                modalSupport: true,
                collapsible: false,
                resizable: false
            },
            width: 400,
            minWidth: 400,
            title,
            icon,
            className,
            item: currentRecord
                ? contactProfile()
                : placeholder('Select a contact to view their details.'),
            bbar: bbar()
        });
    }
});

const contactProfile = hoistCmp.factory({
    render() {
        return div({
            className: 'tb-contact-details-panel__inner',
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

const picture = hoistCmp.factory<DetailsPanelModel>(({model}) =>
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

const tagsField = hoistCmp.factory<DetailsPanelModel>(({model}) =>
    formField({
        field: 'tags',
        item: select({
            enableCreate: true,
            enableMulti: true,
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
    const {isFavorite} = model.currentRecord.data;
    return button({
        text: isFavorite ? 'Remove Favorite' : 'Make Favorite',
        icon: Icon.favorite({
            color: isFavorite ? 'gold' : null,
            prefix: isFavorite ? 'fas' : 'far'
        }),
        width: 150,
        minimal: false,
        onClick: () => model.toggleFavorite()
    });
});

const editButton = hoistCmp.factory<DetailsPanelModel>(({model}) => {
    const {isEditing} = model;
    return button({
        text: isEditing ? 'Save Changes' : 'Edit Contact',
        intent: isEditing ? 'primary' : null,
        minimal: !isEditing,
        onClick: () => model.toggleEditAsync()
    });
});
