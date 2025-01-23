import {HoistModel, lookup} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {DetailModel} from '../DetailModel';

export class ChartsModel extends HoistModel {
    parentModel: DetailModel;
    @lookup(DashViewModel) dashViewModel: DashViewModel;

    get symbol() {
        return this.parentModel.selectedSymbol;
    }

    constructor({parentModel}: {parentModel: DetailModel}) {
        super();
        this.parentModel = parentModel;
    }
}
