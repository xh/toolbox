/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import moment from 'moment';
import {dateCol} from '@xh/hoist/cmp/grid/columns';
import {compactDateRenderer} from '@xh/hoist/format';
import {managed} from '@xh/hoist/core/mixins';
import {Icon} from '@xh/hoist/icon/Icon';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';

import {DetailsPanelModel} from './DetailsPanelModel';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class RecallsPanelModel {

    @bindable
    searchQuery = '';

    @managed // use managed to manage life cycle of model objects
    detailsPanelModel = new DetailsPanelModel();

    @managed
    gridModel = new GridModel({

        store: {
            idSpec: this.createId,
            processRawData: this.processRecord

        },
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        compact: XH.appModel.useCompactGrids,
        stateModel: 'recalls-main-grid',
        // stateModel is user preference for positions of grid sort
        columns: [
            {
                field: 'classification',
                headerName: 'Class',
                align: 'center',
                width: 65,
                tooltip: (cls) => `${cls} ${cls === 'Not Yet Classified' ? '' : ' | Click for more details' }`,
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
                field: 'recallDate', // <~ never want to change
                ...dateCol, // <~ XH convention to spread framework column 2nd line
                headerName: 'Date',
                width: 100,
                renderer: compactDateRenderer('MMM D'),
                tooltip: (date) => `${date}`
            },
            {
                field: 'description',
                width: 400,
                hidden: true
            },
            {
                field: 'recallingFirm',
                width: 150,
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
        this.addReaction({
            track: () => this.gridModel.selectedRecord,
            run: (rec) => this.detailsPanelModel.setRecord(rec)
            // ^ addReaction.run BOGO:
            //   run takes a callback function that is given
        });

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            delay: ONE_SECOND
        });
    }


    //------------------------
    // Implementation
    //------------------------
    // provided by @LoadSupport
    async doLoadAsync(loadSpec) {
        await XH
            .fetchJson({
                url: 'recalls',
                params: {searchQuery: this.searchQuery},
                loadSpec
            })  // no forward slash == relative path
            .then(rxRecallEntries => {
                const {gridModel} = this;
                gridModel.loadData(rxRecallEntries);
                if (!gridModel.hasSelection) gridModel.selectFirst();
            })
            .catchDefault();
    }

    processRecord(rawRec) {

        const ret = {
            ...rawRec,
            brandName: rawRec.openfda.brand_name[0],
            genericName: rawRec.openfda.generic_name[0],
            recallDate: moment(rawRec.recall_initiation_date).toDate(),
            description: rawRec.product_description,
            recallingFirm: rawRec.recalling_firm,
            reason: rawRec.reason_for_recall
        };
        // console.log(ret);
        return ret;
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

// Hoist builds on top of AG Grid to let you do common tasks as one liners
// aka POWERFUL!  we do EXTREMELY HEAVY LIFTING!
// *remember user preferences / sort*
//      - settings local to browser (localStorage)