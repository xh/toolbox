import {hoistCmp} from '@xh/hoist/core';
import {div, box, img} from '@xh/hoist/cmp/layout';
import {vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './FacebookLayout.scss';

export const facebookLayout = hoistCmp.factory({
    render({model}) {
        return box({
            style: {
                flexWrap: 'wrap'
            },
            items: [...model.gridModel.store.records.map(record => {
                const isSelected = model.gridModel.selModel.selectedRecordId === record.id;

                return vbox({
                    height: 150,
                    width: 250,
                    alignItems: 'center',
                    justifyContent: 'center',
                    onClick: () => model.gridModel.selModel.select(record),
                    className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
                    items: [
                        record.data.profilePicture ? img({src: record.data.profilePicture, height: 125, width: 125}) : Icon.user({size: '2x'}),
                        div(record.data.name)
                    ]
                });
            }
            )]
        });
    }
});
