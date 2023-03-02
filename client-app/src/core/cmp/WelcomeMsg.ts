import {hoistCmp, XH} from '@xh/hoist/core';
import {div, img, br} from '@xh/hoist/cmp/layout';
import './WelcomeMsg.scss';

export const welcomeMsg = hoistCmp.factory(({multiline}) => {
    const user = XH.getUser();
    return div({
        className: `tb-welcome-message ${multiline ? 'tb-welcome-message--multiline' : ''}`,
        items: [
            div({
                className: 'tb-welcome-message__profile-pic',
                item: img({src: user.profilePicUrl}),
                omit: !user.profilePicUrl
            }),
            `Welcome, `,
            multiline ? br() : null,
            user.displayName
        ]
    });
});
