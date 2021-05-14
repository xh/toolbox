import {div, filler, hbox, img, placeholder} from '@xh/hoist/cmp/layout';
import {XH, hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {Icon} from '@xh/hoist/icon/Icon';
import './DetailsPanel.scss';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button/index';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),
    className: 'contact-details-panel',

    render({model, className, ...props}) {
        const {currentRecord} = model;

        return panel({
            title: currentRecord?.data.name ?? 'Select a contact',
            className,
            icon: Icon.detail(),
            width: 325,
            flex: 'none',
            items: currentRecord ? renameThisProfile({record: currentRecord}) : placeholder('Select a contact to view their details.'),
            ...props
        });
    }
});

const renameThisProfile = hoistCmp.factory({
    render({model, record}) {
        const {data} = record;
        const {profilePicture, isFavorite} = data;
        const readonlyRenderer = (val) => val ?? '-';

        return div({
            className: 'contact-details-panel__inner',
            items: [
                profilePicture ? img({
                    src: profilePicture,
                    className:
                        'contact-record-user-image'
                }) : Icon.user({
                    size: '10x',
                    className: 'contact-record-user-image'
                }),
                form({
                    fieldDefaults: {
                        inline: true,
                        labelWidth: 100
                    },
                    items: [
                        formField({
                            field: 'name',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'email',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'location',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'workPhone',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'cellPhone',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'homePhone',
                            readonlyRenderer,
                            item: textInput()
                        }),
                        formField({
                            field: 'bio',
                            readonlyRenderer,
                            item: textArea()
                        })
                    ]
                }),
                hbox({
                    items: [
                        button({
                            text: isFavorite ? 'Remove Favorite' : 'Add Favorite',
                            icon: Icon.favorite({
                                color: isFavorite ? 'gold' : null,
                                prefix: isFavorite ? 'fas' : 'far'}
                            ),
                            width: 150,
                            // outlined: true,
                            minimal: false,
                            onClick: () => model.toggleFavorite()
                        }),
                        filler(),
                        button({
                            omit: !XH.getUser().isHoistAdmin,
                            text: model.readonly ? 'Edit' : 'Save Changes',
                            onClick: () => model.toggleEditAsync()
                        })
                    ]
                })

            ]
        });
    }
});