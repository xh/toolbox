import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {capitalize} from 'lodash';
import {
    commissionCol,
    costCol,
    dayPnlCol,
    longMktValCol,
    mktValCol,
    pnlCol,
    shortMktValCol
} from '../../../core/columns/Positions';
import {nameCol} from '../../../core/columns/General';
import type {PortfolioModel} from '../PortfolioModel';

export class PositionsGridModel extends HoistModel {
    override xhName = 'positionsGrid';
    readonly parentModel: PortfolioModel;
    @managed gridModel: GridModel;

    @bindable accessor loadTimestamp: number;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get collapsedTitle() {
        return this.parentModel.groupingChooserModel.value.map(it => capitalize(it)).join(' › ');
    }

    constructor({parentModel}) {
        super();
        this.parentModel = parentModel;
        this.persistWith = this.parentModel.persistWith;

        this.gridModel = new GridModel({
            xhName: this.childXhName('grid'),
            persistWith: {...this.persistWith, path: 'portfolioGrid'},
            expandLevel: 1,
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
                    isTreeColumn: true,
                    pinned: true
                },
                {...mktValCol},
                {...pnlCol, highlightOnChange: true},
                {...dayPnlCol, highlightOnChange: true},
                {...longMktValCol},
                {...shortMktValCol},
                {...costCol},
                {...commissionCol}
            ]
        });
    }
}
