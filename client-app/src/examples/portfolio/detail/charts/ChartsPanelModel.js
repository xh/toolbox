import {HoistModel} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {OrdersPanelModel} from '../OrdersPanelModel';

export class ChartsPanelModel extends HoistModel  {

    @observable symbol = null;

    onLinked() {
        makeObservable(this);
        const ordersPanelModel = this.lookupModel(OrdersPanelModel);
        this.addReaction({
            track: () => ordersPanelModel.selectedRecord?.data.symbol ?? null,
            run: (symbol) => {
                this.symbol = symbol;
            },
            debounce: 500
        });
    }
}