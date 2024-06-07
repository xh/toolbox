import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {div, img, br} from '@xh/hoist/cmp/layout';
import './WelcomeMsg.scss';

interface WelcomeMsgProps extends HoistProps {
    multiline?: boolean;
}

export const welcomeMsg = hoistCmp.factory<WelcomeMsgProps>(({multiline}) => {
    const user = XH.getUser();
    return div({
        className: `tb-welcome-message ${multiline ? 'tb-welcome-message--multiline' : ''}`,
        items: [
            div({
                className: 'tb-welcome-message__profile-pic',
                // referrerPolicy prop necessary for some Google profile pics.
                item: img({src: user.profilePicUrl, referrerPolicy: 'no-referrer'}),
                omit: !user.profilePicUrl
            }),
            `Welcome, `,
            multiline ? br() : null,
            user.displayName
        ]
    });
});
