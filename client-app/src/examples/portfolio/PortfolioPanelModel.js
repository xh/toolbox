import {HoistModel, LoadSupport, managed, loadAllAsync} from '@xh/hoist/core';
import {PositionsPanelModel} from './PositionsPanelModel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';
import {bindable} from '@xh/hoist/mobx';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {PositionInfoPanelModel} from './PositionInfoPanelModel';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed positionsPanelModel = new PositionsPanelModel();
    @managed splitTreeMapModel = new SplitTreeMapModel({
        gridModel: this.positionsPanelModel.gridModel,
        mapFilter: rec => rec.pnl >= 0,
        mapTitleFn: (mapName, model) => {
            const isPrimary = mapName === 'primary',
                v = isPrimary ? model.primaryMapTotal : model.secondaryMapTotal;
            return [
                isPrimary ? 'Profit:' : 'Loss:',
                hspacer(5),
                fmtMillions(v, {
                    prefix: '$',
                    precision: 2,
                    label: true,
                    asElement: true
                })
            ];
        },
        treeMapModelConfig: {
            labelField: 'name',
            valueField: 'pnl',
            heatField: 'pnl',
            valueFieldLabel: 'Pnl'
        },
        orientation: 'horizontal'
    });
    @managed positionInfoPanelModel = new PositionInfoPanelModel();

    get selectedPosition() {
        return this.positionsPanelModel.selectedRecord;
    }

    constructor() {
        this.addReaction(this.selectedPositionReaction());
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.positionsPanelModel,
            this.positionInfoPanelModel
        ], loadSpec);
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    selectedPositionReaction() {
        return {
            track: () => this.selectedPosition,
            run: (position) => {
                this.positionInfoPanelModel.setPositionId(position ? position.id : null);
            },
            delay: 500
        };
    }
}