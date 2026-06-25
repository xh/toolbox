import {div, img} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, HoistUser, XH} from '@xh/hoist/core';
import './ProfilePic.scss';

export const profilePic = hoistCmp.factory<HoistProps & {user: HoistUser}>({
    className: 'tb-profile-pic',

    render({user, className}) {
        return div({
            className,
            // referrerPolicy prop necessary for some Google profile pics.
            item: user.profilePicUrl
                ? img({src: user.profilePicUrl, referrerPolicy: 'no-referrer'})
                : XH.getUserInitials()
        });
    }
});
