import {HoistModel, managed} from '@xh/hoist/core';
import {observable, makeObservable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {PERSIST_DETAIL} from '../AppModel';
import {PortfolioPanelModel} from '../PortfolioPanelModel';

export class DetailPanelModel extends HoistModel {
    @observable positionId = null;

    @managed ordersPanelModel: OrdersPanelModel;

    @managed panelSizingModel = new PanelModel({
        defaultSize: 400,
        minSize: 250,
        maxSize: 500,
        side: 'bottom',
        renderMode: 'unmountOnHide',
        persistWith: PERSIST_DETAIL
    });

    parentModel: PortfolioPanelModel;

    get collapsed() {
        return this.panelSizingModel.collapsed;
    }

    constructor({persistWith, parentModel}) {
        super();
        makeObservable(this);
        this.parentModel = parentModel;
        this.ordersPanelModel = new OrdersPanelModel({persistWith, parentModel: this});
    }
}
