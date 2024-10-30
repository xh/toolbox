import {HoistModel, lookup} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {OrdersModel} from '../orders/OrdersModel';

export class ChartsModel extends HoistModel {
    @lookup(OrdersModel) ordersModel: OrdersModel;

    @observable symbol = null;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.addReaction({
            track: () => this.ordersModel.selectedSymbol,
            run: symbol => (this.symbol = symbol),
            debounce: 500
        });
    }
}
