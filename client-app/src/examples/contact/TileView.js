import {hoistCmp} from '@xh/hoist/core';
import {div, tileFrame, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './TileView.scss';

export const tileView = hoistCmp.factory({
    render({model}) {
        const {store, selModel} = model.gridModel;
        const {selectedRecordId} = selModel;

        return tileFrame({
            spacing: 10,
            desiredRatio: 1.25,
            minTileWidth: 300,
            maxTileWidth: 600,
            minTileHeight: 250,
            maxTileHeight: 250,
            items: store.records.map(record => {
                const isSelected = selectedRecordId === record.id;
                const {profilePicture, name} = record.data;

                return vframe({
                    style: profilePicture ? {backgroundImage: `url(${profilePicture})`} : null,
                    onClick: () => selModel.select(record),
                    className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
                    items: [
                        profilePicture ? null : Icon.user({size: '2x'}),
                        div({
                            className: profilePicture ? 'floating-name-bar' : null,
                            item: div({
                                className: profilePicture ? 'floating-name' : null,
                                item: name
                            })
                        })
                    ]
                });
            }
            )
        });
    }
});
