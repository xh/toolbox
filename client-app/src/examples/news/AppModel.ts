import {HoistAppModel, XH, managed} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {NewsPanelModel} from './NewsPanelModel';

export const App = {
    get model()          {return XH.appModel as AppModel},
    get oauthService()   {return XH.getService(OauthService)}
};

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
        await App.oauthService.logoutAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}