import {HoistAppModel, managed, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {NewsPanelModel} from './NewsPanelModel';

export class AppModel extends HoistAppModel {

    @managed
    newsPanelModel;

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync();
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
