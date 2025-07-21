import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {capitalize} from 'lodash';
import {mktValCol, nameCol, pnlCol} from '../../../core/columns';
import {PortfolioModel} from '../PortfolioModel';

export class PositionsGridModel extends HoistModel {
    readonly parentModel: PortfolioModel;
    @managed gridModel: GridModel;

    @bindable loadTimestamp: number;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get collapsedTitle() {
        return this.parentModel.groupingChooserModel.value.map(it => capitalize(it)).join(' › ');
    }

    constructor({parentModel}) {
        super();
        makeObservable(this);
        this.parentModel = parentModel;
        this.persistWith = this.parentModel.persistWith;

        this.gridModel = new GridModel({
            persistWith: {...this.persistWith, path: 'portfolioGrid'},
            expandToLevel: 1,
            levelLabels: () => this.parentModel.groupingChooserModel.valueDisplayNames,
            store: this.parentModel.store,
            treeMode: true,
            treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
            sortBy: 'pnl|desc|abs',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            showSummary: true,
            columns: [
                {
                    field: 'id',
                    width: 40,
                    hidden: true
                },
                {
                    ...nameCol,
                    width: null,
                    flex: 1,
                    isTreeColumn: true
                },
                {...mktValCol},
                {...pnlCol, highlightOnChange: true}
            ]
        });
    }
}
