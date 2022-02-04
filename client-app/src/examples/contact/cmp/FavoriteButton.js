import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/desktop/cmp/button';

import './FavoriteButton.scss';

export const favoriteButton = hoistCmp.factory(
    ({model, record}) => {
        const {isFavorite} = record.data;
        return button({
            className: 'tb-contact-fave-btn',
            icon: Icon.favorite({
                color: isFavorite ? 'gold' : null,
                prefix: isFavorite ? 'fas' : 'far'
            }),
            onClick: (e) => {
                e.stopPropagation();
                model.toggleFavorite(record);
            }
        });
    }
);
