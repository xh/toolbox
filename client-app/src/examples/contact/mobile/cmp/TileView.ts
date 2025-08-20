import {hoistCmp} from '@xh/hoist/core';
import DirectoryPanelModel from '../DirectoryPanelModel';
import {tileFrame, vbox, div, span, filler} from '@xh/hoist/cmp/layout';

import {favoriteButton} from './FavoriteButton';
import '../../TileView.scss';

const tileView = hoistCmp.factory<DirectoryPanelModel>({
    render({model}) {
        return tileFrame({
            spacing: 10,
            maxTileHeight: 200,
            minTileHeight: 150,
            maxTileWidth: 200,
            minTileWidth: 150,
            items: model.records.map(record => tile({record}))
        });
    }
});

const tile = hoistCmp.factory<DirectoryPanelModel>(({model, record}) => {
    const {gridModel} = model;
    const isSelected = gridModel.selectedId === record.id;
    const {profilePicture, name} = record.data;

    return vbox({
        style: {backgroundImage: `url(${profilePicture})`},
        className: `tb-contact-tile ${isSelected ? 'tb-contact-tile--selected' : ''}`,
        items: [
            div({
                className: 'tb-contact-tile__bar',
                // This inline style defintion keeps me from needing to fight with
                // existing styles when making the mobile button want to center itself
                style: {alignItems: 'center'},
                items: [
                    favoriteButton({record}),
                    filler(),
                    span({
                        className: 'tb-contact-tile__name',
                        item: name
                    })
                ]
            })
        ],
        onClick: () => gridModel.selectAsync(record)
    });
});

export default tileView;
