import {div, filler, span, tileFrame, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {favoriteButton} from './FavoriteButton';
import './TileView.scss';

export const tileView = hoistCmp.factory({
    render({model}) {
        return tileFrame({
            spacing: 10,
            items: model.records.map(record => tile({record}))
        });
    }
});

const tile = hoistCmp.factory(
    ({model, record}) => {
        const {gridModel} = model,
            isSelected = gridModel.selectedRecordId === record.id,
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
                        })]
                })
            ],
            onClick: () => gridModel.selectAsync(record)
        });
    }
);

