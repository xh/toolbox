import {managed} from '@xh/hoist/core';
import {Span} from '@xh/hoist/utils/telemetry';
import {NewsPanelModel} from './NewsPanelModel';
import {BaseAppModel} from '../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    @managed newsPanelModel: NewsPanelModel;

    override async initAsync(span: Span) {
        await super.initAsync(span);
        this.newsPanelModel = new NewsPanelModel();
        this.loadAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.newsPanelModel.loadAsync(loadSpec);
    }
}
