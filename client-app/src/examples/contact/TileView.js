import {hoistCmp} from '@xh/hoist/core';
import {div, filler, span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './TileView.scss';
import {box, vbox} from '@xh/hoist/cmp/layout/index';

export const tileView = hoistCmp.factory({
    render({model}) {
        const {store, selModel} = model.gridModel;
        const {selectedRecordId} = selModel;

        return box({
            flexWrap: 'wrap',
            items: store.records.map(record => {
                const isSelected = selectedRecordId === record.id;
                const {profilePicture, name} = record.data;

                return vbox({
                    style: profilePicture ? {backgroundImage: `url(${profilePicture})`} : null,
                    height: 150,
                    width: 250,
                    onClick: () => selModel.select(record),
                    className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
                    items: [
                        profilePicture ? null : Icon.user({size: '2x'}),
                        div({
                            className: profilePicture ? 'floating-name-bar' : null,
                            items: [
                                span({
                                    item: model.renderFavorite(record)
                                }),
                                filler(),
                                span({
                                    className: profilePicture ? 'floating-name' : null,
                                    item: name
                                })]
                        })
                    ]
                });
            }
            )
        });
    }
});
