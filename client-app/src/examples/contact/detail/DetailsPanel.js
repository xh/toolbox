import {div, img, placeholder, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {Icon} from '@xh/hoist/icon/Icon';
import {startCase} from 'lodash';
import './DetailsPanel.scss';
import {panel} from '@xh/hoist/desktop/cmp/panel';

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
            items: currentRecord ? renameThisProfile({record: currentRecord}) : placeholder('Select a contact to view their details.'),
            ...props
        });
    }
});

const renameThisProfile = hoistCmp.factory({
    render({record}) {
        const recordFields = Object.keys(record.data).filter(str => !['id', 'isFavorite', 'profilePicture'].includes(str));

        return vbox({
            items: [
                record?.data.profilePicture ? img({
                    src: record
                        .data
                        .profilePicture,
                    className:
                        'contact-record-user-image'
                }) : Icon.user({
                    size: '10x',
                    className: 'contact-record-user-image'
                }),
                ...recordFields.map(contactRecordField => {
                    const value = record.data[contactRecordField];
                    return record.data[contactRecordField] ? recordFieldEntry({
                        contactRecordField,
                        value
                    }) : null;
                })
            ]
        });
    }
});

const recordFieldEntry = hoistCmp.factory({
    render({contactRecordField, value}) {
        return vbox({
            item: [
                div({
                    className: 'contact-record-entry-heading',
                    item: startCase(contactRecordField)
                }),
                div({
                    className: 'contact-record-entry-value',
                    item: value
                })
            ]
        });
    }
});
