import {div, img, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {Icon} from '@xh/hoist/icon/Icon';
import './DetailsPanel.scss';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),

    render({model}) {
        const {currentRecord} = model;
        if (!currentRecord) return null;

        const recordFields = Object.keys(currentRecord.data).filter(str => !['id', 'isFavorite', 'profilePicture'].includes(str));

        return vbox({
            className: 'recalls-detail-wrapper',
            item: [
                currentRecord.data.profilePicture ? img({src: currentRecord.data.profilePicture, height: 125, width: 125, className: 'contact-record-user-image'}) : Icon.user({
                    size: '10x',
                    className: 'contact-record-user-image'
                }),
                ...recordFields.map(foo => {
                    const value = currentRecord.data[foo];
                    return currentRecord.data[foo] ? recordFieldEntry({foo, value}) : null;
                })
            ]
        });
    }
});

const recordFieldEntry = hoistCmp.factory({
    render({foo, value}) {
        return vbox({
            item: [
                div({
                    className: 'contact-record-entry-heading',
                    item: foo
                }),
                div({
                    className: 'contact-record-entry-value',
                    item: value
                })
            ]
        });
    }
});
