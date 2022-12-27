import {HoistAppModel, XH, managed} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {NewsPanelModel} from './NewsPanelModel';


export class AppModel extends HoistAppModel {

    static instance: AppModel;
    @managed newsPanelModel: NewsPanelModel;

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync();
    }

    override async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }

    override get supportsVersionBar(): boolean {return window.self === window.top}
}
