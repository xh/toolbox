import {loadAllAsync, LoadSpec, managed, XH} from '@xh/hoist/core';
import {themeAppOption} from '@xh/hoist/mobile/cmp/appOption';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {BaseAppModel} from '../BaseAppModel';
import {listView} from './list/ListView';
import {meetingView} from './meeting/MeetingView';
import {ClubService} from './svc/ClubService';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: listView},
            {id: 'meeting', content: meetingView}
        ]
    });

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/musiclub',
                children: [
                    {
                        name: 'meeting',
                        path: '/meeting/:id<\\d+>'
                    }
                ]
            }
        ];
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ClubService);
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadAllAsync([], loadSpec);
    }

    override get supportsVersionBar() {
        return false;
    }
}
