import {InitContext, managed} from '@xh/hoist/core';
import {NewsPanelModel} from './NewsPanelModel';
import {BaseAppModel} from '../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    @managed newsPanelModel: NewsPanelModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync({span: ctx.span});
    }

    override async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
