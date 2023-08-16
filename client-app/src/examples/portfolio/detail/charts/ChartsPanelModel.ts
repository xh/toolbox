import {HoistModel, lookup} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {OrdersPanelModel} from '../OrdersPanelModel';

export class ChartsPanelModel extends HoistModel {
    @observable symbol = null;
    @lookup(OrdersPanelModel) ordersPanelModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.addReaction({
            track: () => this.ordersPanelModel.selectedRecord?.data.symbol ?? null,
            run: symbol => {
                this.symbol = symbol;
            },
            debounce: 500
        });
    }
}
