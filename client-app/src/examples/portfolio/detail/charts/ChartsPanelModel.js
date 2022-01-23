import {HoistModel, lookup} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {OrdersPanelModel} from '../OrdersPanelModel';

export class ChartsPanelModel extends HoistModel  {

    @observable symbol = null;
    @lookup(OrdersPanelModel) ordersPanelModel;

    onLinked() {
        makeObservable(this);
        this.addReaction({
            track: () => this.ordersPanelModel.selectedRecord?.data.symbol ?? null,
            run: (symbol) => {
                this.symbol = symbol;
            },
            debounce: 500
        });
    }
}