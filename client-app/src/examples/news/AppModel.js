import {HoistAppModel, managed, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {NewsPanelModel} from './NewsPanelModel';

@HoistAppModel
export class AppModel {

    @managed
    newsPanelModel;

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    async preAuthInitAsync() {
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
