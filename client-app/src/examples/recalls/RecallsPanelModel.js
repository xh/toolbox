/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {managed} from '@xh/hoist/core/mixins';
import {GridModel} from '@xh/hoist/cmp/grid';
import {localDateCol} from '@xh/hoist/cmp/grid/columns';
import {compactDateRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon/Icon';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';

import {DetailsPanelModel} from './DetailsPanelModel';

@HoistModel
@LoadSupport
export class RecallsPanelModel {

    @bindable
    searchQuery = '';

    @bindable
    groupBy = null;

    @managed
    detailsPanelModel = new DetailsPanelModel();

    @managed
    gridModel = new GridModel({
        store: {
            idSpec: this.createId,
            processRawData: this.processRecord,
            fields: [{
                name: 'recallDate',
                type: 'localDate'
            }]
        },
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        compact: XH.appModel.useCompactGrids,
        stateModel: 'recalls-main-grid',
        columns: [
            {
                field: 'classification',
                headerName: 'Class',
                align: 'center',
                width: 65,
                tooltip: (cls) => cls,
                elementRenderer: this.classificationRenderer
            },
            {
                field: 'brandName',
                width: 300
            },
            {
                field: 'genericName',
                width: 300,
                hidden: true
            },
            {
                field: 'status',
                width: 100
            },
            {
                field: 'recallingFirm',
                width: 200
            },
            {
                field: 'recallDate',
                ...localDateCol,
                headerName: 'Date',
                width: 100,
                renderer: compactDateRenderer('MMM D')
            },
            {
                field: 'description',
                width: 400,
                hidden: true
            },
            {
                field: 'reason',
                width: 200,
                hidden: true
            }

        ]
    });

    constructor() {
        const {gridModel} = this;

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: (rec) => this.detailsPanelModel.setRecord(rec)
        });

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            delay: ONE_SECOND
        });

        this.addReaction({
            track: () => this.groupBy,
            run: (selectedGroup) => gridModel.setGroupBy(selectedGroup)
        });

        const {groupBy} = gridModel;
        this.setGroupBy(groupBy && groupBy.length > 0 ? groupBy[0] : null);
    }


    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        await XH
            .fetchJson({
                url: 'recalls',
                params: {searchQuery: this.searchQuery},
                loadSpec
            })
            .then(rxRecallEntries => {
                const {gridModel} = this;
                gridModel.loadData(rxRecallEntries);
                if (!gridModel.hasSelection) gridModel.selectFirst();
            })
            .catchDefault();
    }

    processRecord(rawRec) {
        return {
            ...rawRec,
            brandName: rawRec.openfda.brand_name[0],
            genericName: rawRec.openfda.generic_name[0],
            recallDate: rawRec.recall_initiation_date,
            description: rawRec.product_description,
            recallingFirm: rawRec.recalling_firm,
            reason: rawRec.reason_for_recall
        };
    }

    createId(record) {
        return record.brandName + record.recall_number;
    }

    classificationRenderer(val) {
        switch (val) {
            case 'Class I':
                return Icon.skull({className: 'xh-red'});
            case 'Class II':
                return Icon.warning({className: 'xh-orange'});
            case 'Class III':
                return Icon.info({className: 'xh-blue'});
            default:
                return null;
        }
    }
}
