import {hoistCmp} from '@xh/hoist/core';
import {div, filler, span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './TileView.scss';
import {vframe, box, vbox} from '@xh/hoist/cmp/layout/index';
import {favoriteButton} from './FavoriteButton';

export const tileView = hoistCmp.factory({
    render({model}) {
        return vframe(
            box({
                flexWrap: 'wrap',
                items: model.records.map(record => tile({record}))
            }),
            filler()
        );
    }
});

const tile = hoistCmp.factory(
    ({model, record}) => {
        const {gridModel} = model,
            isSelected = gridModel.selectedRecordId === record.id,
            {profilePicture, name} = record.data;

        return vbox({
            style: profilePicture ? {backgroundImage: `url(${profilePicture})`} : null,
            height: 150,
            width: 250,
            onClick: () => gridModel.selectAsync(record),
            className: `contact-fb-tile ${isSelected ? 'contact-fb-tile--selected' : ''}`,
            items: [
                profilePicture ? null : Icon.user({size: '2x'}),
                div({
                    className: profilePicture ? 'floating-name-bar' : null,
                    items: [
                        favoriteButton({record}),
                        filler(),
                        span({
                            className: profilePicture ? 'floating-name' : null,
                            item: name
                        })]
                })
            ]
        });
    }
);

