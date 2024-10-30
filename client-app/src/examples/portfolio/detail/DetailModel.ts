import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {AppModel} from '../AppModel';
import {PortfolioModel} from '../PortfolioModel';
import {OrdersModel} from './orders/OrdersModel';

export class DetailModel extends HoistModel {
    @lookup(PortfolioModel) parentModel: PortfolioModel;

    @managed ordersPanelModel: OrdersModel;
    @managed panelModel: PanelModel;

    @observable positionId = null;

    get collapsed() {
        return this.panelModel.collapsed;
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.ordersPanelModel = new OrdersModel({parentModel: this});

        this.panelModel = new PanelModel({
            persistWith: {...AppModel.instance.persistWith, path: 'detailPanel'},
            defaultSize: 400,
            minSize: 250,
            maxSize: 500,
            side: 'bottom',
            renderMode: 'unmountOnHide'
        });

        this.addReaction({
            track: () => this.parentModel.selectedPosition,
            run: position => (this.positionId = position?.id ?? null),
            debounce: 300
        });
    }
}
