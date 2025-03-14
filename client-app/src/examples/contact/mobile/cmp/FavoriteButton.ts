import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {consumeEvent} from '@xh/hoist/utils/js';
import {button} from '@xh/hoist/mobile/cmp/button';

import ContactsPageModel from '../DirectoryPanelModel';
import '../../FavoriteButton.scss';

export const favoriteButton = hoistCmp.factory<ContactsPageModel>(({model, record}) => {
    const {isFavorite} = record.data;
    return button({
        className: 'tb-contact-fave-btn',
        height: null,
        style: {backgroundColor: 'transparent'},
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
