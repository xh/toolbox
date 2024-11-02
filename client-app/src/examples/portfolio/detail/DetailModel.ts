import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {AppModel} from '../AppModel';
import {PortfolioModel} from '../PortfolioModel';
import {chartsPanel} from './charts/ChartsPanel';
import {ordersGrid} from './orders/OrdersGrid';
import {OrdersModel} from './orders/OrdersModel';

export class DetailModel extends HoistModel {
    @lookup(PortfolioModel) parentModel: PortfolioModel;

    @managed dashModel: DashContainerModel;
    @managed ordersModel: OrdersModel;
    @managed panelModel: PanelModel;

    @observable positionId = null;

    /**
     * Symbol-level context for any charts within this detail panel.
     * Set by ordersModel when a symbol is selected.
     */
    @bindable selectedSymbol: string = null;

    get collapsed() {
        return this.panelModel.collapsed;
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.dashModel = new DashContainerModel({
            showMenuButton: true,
            persistWith: {...AppModel.instance.persistWith, path: 'detailDash'},
            viewSpecs: [
                {
                    id: 'orders',
                    icon: Icon.edit(),
                    content: () => ordersGrid({modelConfig: {parentModel: this}})
                },
                {
                    id: 'charts',
                    icon: Icon.chartArea(),
                    content: () => chartsPanel({modelConfig: {parentModel: this}})
                }
            ],
            initialState: [
                {
                    type: 'row',
                    content: [
                        {type: 'view', id: 'orders'},
                        {type: 'view', id: 'charts'}
                    ]
                }
            ]
        });

        this.panelModel = new PanelModel({
            persistWith: {...AppModel.instance.persistWith, path: 'detailPanel'},
            defaultSize: 400,
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
