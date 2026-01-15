import {br, div} from '@xh/hoist/cmp/layout';
import './WelcomeMsg.scss';
import {hoistCmp, XH} from '@xh/hoist/core';
import {profilePic} from './ProfilePic';

export const welcomeMsg = hoistCmp.factory(({multiline}) => {
    const user = XH.getUser();
    return div({
        className: `tb-welcome-message ${multiline ? 'tb-welcome-message--multiline' : ''}`,
        items: [
            profilePic({user, className: 'xh-margin-right'}),
            `Welcome, `,
            multiline ? br() : null,
            user.displayName
        ]
    });
});
