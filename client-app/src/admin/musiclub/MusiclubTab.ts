import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {Icon} from '@xh/hoist/icon/Icon';
import {mbEntityRestGrid} from './MbEntityRestGrid';
import {meetingRestGrid} from './MeetingRestGrid';
import {songPlayRestGrid} from './SongPlayRestGrid';

export const musiclubTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.musiclub',
            tabs: [
                {id: 'meetings', icon: Icon.users(), content: meetingRestGrid},
                {id: 'plays', icon: Icon.list(), content: songPlayRestGrid},
                {id: 'entities', icon: Icon.database(), content: mbEntityRestGrid}
            ],
            switcher: {orientation: 'left'}
        }
    })
);
