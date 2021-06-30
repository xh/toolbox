import {XH, hoistCmp, uses} from '@xh/hoist/core';
import {div, box, filler, img, placeholder, p} from '@xh/hoist/cmp/layout';
import {form} from '@xh/hoist/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {textArea, textInput, select} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {Icon} from '@xh/hoist/icon/Icon';
import {DetailsPanelModel} from './DetailsPanelModel';
import './DetailsPanel.scss';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),
    className: 'contact-details-panel',

    render({model, className}) {
        return panel({
            className,
            width: 400,
            flex: 'none',
            tbar: tbar(),
            items: model.currentRecord ? profilePanel() : placeholder('Select a contact to view their details.')
        });
    }
});

const profilePanel = hoistCmp.factory({
    render({model}) {
        const {isEditing} = model;

        return div({
            className: 'contact-details-panel__inner',
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
                }),
                toolbar({
                    className: 'details-bottom-toolbar',
                    items: [
                        favoriteButton({omit: isEditing}),
                        filler(),
                        editButton({omit: !XH.getUser().isHoistAdmin})
                    ]
                })
            ]
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {currentRecord} = model;

        if (!currentRecord)  return null;

        return div({
            className: 'details-panel-title-bar',
            items: [
                Icon.detail({
                    size: 'lg',
                    className: 'details-title-icon'
                }),
                currentRecord.data.name
            ]
        });
    }
);

const picture = hoistCmp.factory(
    ({model}) => {
        const {profilePicture} = model.currentRecord.data;
        return profilePicture ?
            img({src: profilePicture, className: 'contact-record-user-image'}) :
            Icon.user({size: '10x', className: 'contact-record-user-image'});
    }
);

//--------------
// FormFields
//--------------
const textField = hoistCmp.factory(
    ({field}) => formField({
        field,
        readonlyRenderer: (val) => val ?? '-',
        item: textInput()
    })
);

const bioField = hoistCmp.factory(
    () => formField({
        field: 'bio',
        label: null,
        className: 'bio-readonly-panel',
        item: textArea({
            minHeight: 250
        }),
        readonlyRenderer: (val) => {
            return val ?
                div({
                    items: val.split('\n').map(v => p(v))
                }) :
                '-';
        }
    })
);

const tagsField = hoistCmp.factory(
    ({model}) => formField({
        field: 'tags',
        item: select({
            enableCreate: true,
            enableMulti: true,
            options: model.directoryPanelModel.tagList
        }),
        readonlyRenderer: (tags) => {
            tags = tags ?? [];
            return box({
                flexWrap: 'wrap',
                items: tags.map(tag => div({className: 'metadata-tag', item: tag}))
            });
        }
    })
);

//------------
// Buttons
//------------
const favoriteButton = hoistCmp.factory(
    ({model}) => {
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
    }
);

const editButton = hoistCmp.factory(
    ({model}) => button({
        text: model.isEditing ? 'Save Changes' : 'Edit',
        onClick: () => model.toggleEditAsync()
    })
);

