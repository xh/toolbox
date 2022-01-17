import {HoistModel, managed} from '@xh/hoist/core';
import {observable, makeObservable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {PERSIST_DETAIL} from '../AppModel';
import {PortfolioPanelModel} from '../PortfolioPanelModel';

export class DetailPanelModel extends HoistModel {

    @observable positionId = null;

    @managed ordersPanelModel = new OrdersPanelModel(this);

    @managed panelSizingModel = new PanelModel({
        defaultSize: 400,
        minSize: 250,
        maxSize: 500,
        side: 'bottom',
        renderMode: 'unmountOnHide',
        persistWith: PERSIST_DETAIL
    });

    get collapsed() {
        return this.panelSizingModel.collapsed;
    }

    onLinked() {
        makeObservable(this);
        const parentModel = this.lookupModel(PortfolioPanelModel);

        this.addReaction({
            track: () => parentModel.selectedPosition,
            run: (position) => {
                this.positionId = position?.id ?? null;
            },
            debounce: 300
        });
    }
}
