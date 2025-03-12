import {hoistCmp} from '@xh/hoist/core';
import ContactsPageModel from '../ContactsPageModel';
import {tileFrame, vbox, div, span, filler} from '@xh/hoist/cmp/layout';

import {favoriteButton} from './FavoriteButton';
import './TileView.scss';

const tileView = hoistCmp.factory<ContactsPageModel>({
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

const tile = hoistCmp.factory<ContactsPageModel>(({model, record}) => {
    const {gridModel} = model,
        isSelected = gridModel.selectedId === record.id,
        {profilePicture, name} = record.data;

    return vbox({
        style: {backgroundImage: `url(${profilePicture})`},
        className: `tb-contact-tile ${isSelected ? 'tb-contact-tile--selected' : ''}`,
        items: [
            div({
                className: 'tb-contact-tile__bar',
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
