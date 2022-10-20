import {HoistAppModel, initServicesAsync, managed} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {NewsPanelModel} from './NewsPanelModel';

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;

    @managed
    newsPanelModel: NewsPanelModel;

    static override async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync();
    }

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
