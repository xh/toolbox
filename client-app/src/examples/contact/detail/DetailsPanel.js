import {div, filler, hbox, img, placeholder} from '@xh/hoist/cmp/layout';
import {XH, hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {Icon} from '@xh/hoist/icon/Icon';
import './DetailsPanel.scss';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {textArea, select} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button/index';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),
    className: 'contact-details-panel',

    render({model, className, ...props}) {
        const {currentRecord} = model;

        return panel({
            className,
            width: 325,
            flex: 'none',
            tbar: detailsTitleBar(),
            items: currentRecord ? profileRenderer({record: currentRecord}) : placeholder('Select a contact to view their details.'),
            ...props
        });
    }
});

const profileRenderer = hoistCmp.factory({
    render({model, record}) {
        const {data} = record;
        const {profilePicture, isFavorite} = data;
        const {directoryPanelModel} = model;
        const {tagList} = directoryPanelModel;
        const ffConf = {
            readonlyRenderer: (val) => val ?? '-',
            item: textArea()
        };

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
                        formField({...ffConf, field: 'name'}),
                        formField({...ffConf, field: 'email'}),
                        formField({...ffConf, field: 'location'}),
                        formField({...ffConf, field: 'workPhone'}),
                        formField({...ffConf, field: 'cellPhone'}),
                        formField({...ffConf, field: 'homePhone'}),
                        formField({
                            field: 'bio',
                            item: textArea(),
                            readonlyRenderer: (val) => {
                                return val ?
                                    div({
                                        className: 'bio-readonly-panel',
                                        item: val
                                    }) :
                                    '-';
                            }                       
                        }),
                        formField({
                            readonlyRenderer: tags => {
                                tags = tags ?? [];
                                const returnDivs = [];

                                tags.forEach(tag => {
                                    returnDivs.push(div({
                                        className: 'metadata-tag',
                                        item: tag
                                    }));
                                });

                                return returnDivs;
                            },
                            item: select({
                                enableCreate: true,
                                enableMulti: true,
                                options: tagList.map(tag => ({value: tag}))
                            }),
                            field: 'tags'})
                    ]
                }),
                hbox({
                    items: [
                        button({
                            text: isFavorite ? 'Remove Favorite' : 'Add Favorite',
                            icon: Icon.favorite({
                                color: isFavorite ? 'gold' : null,
                                prefix: isFavorite ? 'fas' : 'far'
                            }
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

const detailsTitleBar = hoistCmp.factory(
    ({model}) => {
        const {currentRecord} = model;

        return div({
            className: 'details-panel-title-bar',
            items: [
                Icon.detail({
                    size: 'lg',
                    className: 'details-title-icon'
                }),
                currentRecord ? currentRecord.data.name : 'Select a contact to view'
            ]
        });
    });
