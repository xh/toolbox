import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/desktop/cmp/button';

export const favoriteButton = hoistCmp.factory(
    ({model, record}) => {
        const {isFavorite} = record.data;
        return button({
            icon: Icon.favorite({
                color: isFavorite ? 'gold' : null,
                prefix: isFavorite ? 'fas' : 'far'
            }),
            onClick: () => model.toggleFavorite(record)
        });
    }
);