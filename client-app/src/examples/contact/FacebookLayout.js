import {hoistCmp} from '@xh/hoist/core';
import {div, box, img} from '@xh/hoist/cmp/layout';
import {vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './FacebookLayout.scss';

export const facebookLayout = hoistCmp.factory({
    render({model}) {
        const {store, selModel} = model.gridModel;

        return box({
            flexWrap: 'wrap',
            items: store.records.map(record => {
                const isSelected = selModel.selectedRecordId === record.id;
                const {profilePicture, name} = record.data;

                return vbox({
                    height: 150,
                    width: 250,
                    alignItems: 'center',
                    justifyContent: 'center',
                    onClick: () => selModel.select(record),
                    className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
                    items: [
                        profilePicture ? img({src: profilePicture, height: 125, width: 125}) : Icon.user({size: '2x'}),
                        div(name)
                    ]
                });
            }
            )
        });
    }
});
