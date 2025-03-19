import {loadAllAsync, LoadSpec, managed, XH} from '@xh/hoist/core';
import {themeAppOption} from '@xh/hoist/mobile/cmp/appOption';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {BaseAppModel} from '../BaseAppModel';
import {listView} from './list/ListView';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faTurntable} from '@fortawesome/pro-light-svg-icons';
import {ClubService} from './svc/ClubService';

library.add(faTurntable);

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [{id: 'default', content: listView}]
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

    override getAppOptions() {
        return [themeAppOption()];
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ClubService);
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
