import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {consumeEvent} from '@xh/hoist/utils/js';
import {button} from '@xh/hoist/mobile/cmp/button';

import ContactsPageModel from '../ContactsPageModel';
import './FavoriteButton.scss';

export const favoriteButton = hoistCmp.factory<ContactsPageModel>(({model, record}) => {
    const {isFavorite} = record.data;
    return button({
        icon: Icon.favorite({
            color: isFavorite ? 'gold' : null,
            prefix: isFavorite ? 'fas' : 'far'
        }),
        onClick: e => {
            consumeEvent(e);
            model.toggleFavorite(record);
        }
    });
});
