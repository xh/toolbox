import {managed, XH} from '@xh/hoist/core';
import {ContactService} from '../svc/ContactService';
import {BaseAppModel} from '../../../BaseAppModel';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import directoryPanel from './DirectoryPanel';
import detailsPanel from './details/DetailsPanel';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/mobile/cmp/appOption';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: directoryPanel},
            {id: 'details', content: detailsPanel}
        ]
    });

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/contactMobile',
                children: [
                    {
                        name: 'details',
                        path: '/:id'
                    }
                ]
            }
        ];
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(ContactService);
    }
}
