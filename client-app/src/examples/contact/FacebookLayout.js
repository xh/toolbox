import {hoistCmp, uses} from '@xh/hoist/core';
import {div, box} from '@xh/hoist/cmp/layout';
import {FacebookModel} from './FacebookModel';
import {vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './FacebookLayout.scss';

export const facebookLayout = hoistCmp.factory({
    model: uses(FacebookModel), // DMS: Consider replacing with just DirectoryPanelModel

    /**
     * @param {FacebookModel} model
     * */
    render({model}) {
        return box({
            style: {
                flexWrap: 'wrap'
            },
            items: [...model.store.records.map(record => {
                const isSelected = model.selModel.selectedRecordId === record.id;

                return vbox({
                    height: 150,
                    width: 250,
                    alignItems: 'center',
                    justifyContent: 'center',
                    onClick: () => model.selModel.select(record),
                    className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
                    items: [
                        Icon.user({size: '2x'}),
                        div(record.data.name)
                    ]
                });
            }
            )]
        });
    }
});
