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
import {dateRenderer} from '@xh/hoist/format';


@HoistModel
@LoadSupport
export class RecallsPanelModel {

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
                field: 'recallDate', // <~ never want to change
                ...dateCol, // <~ XH convention to spread framework column 2nd line
                renderer: dateRenderer('MMM D'),
                headerName: 'Recalling since',
                width: 120,
                hidden: false
            },
            {
                field: 'brandName',
                width: 300,
                hidden: false
            },
            {
                field: 'genericName',
                width: 300,
                hidden: false
            },
            {
                field: 'status',
                width: 150,
                hidden: false
            },
            {
                field: 'product_description',
                width: 400,
                hidden: true
            },
            {
                field: 'something_else_im_forgetting',
                width: 400,
                hidden: true
            }
        ]
    });

    //------------------------
    // Implementation
    //------------------------


    // provided by @LoadSupport
    async doLoadAsync(loadSpec) {
        await XH
        //
        // think 'recalls' refers to backend path
            .fetchJson({url: 'recalls', loadSpec})  // no forward slash == relative path
            .then(rxRecallEntries => {
                console.log(rxRecallEntries);
                // console log displays the data that has been mutated!
                // can use JSON.stringify() to see original at this line...
                this.gridModel.loadData(rxRecallEntries);
            });
    }

    // 04/18:
    // using processRecord() for now because I'm too lazy to learn Groovy / Java
    // to massage the data format on the backend...
    processRecord(rawRec) {
        rawRec.brandName = rawRec.openfda.brand_name[0];
        rawRec.genericName = rawRec.openfda.generic_name[0];
        rawRec.recallDate = moment(rawRec.recall_initiation_date).toDate();

        return rawRec;
        // use moment to parse date
    }

    createId(record) {
        return record.brandName + record.recall_number;
    }

    // make an export button


}

// Hoist builds on top of AG Grid to let you do common tasks as one liners
// aka POWERFUL!  we do EXTREMELY HEAVY LIFTING!
// *remember user preferences / sort*
//      - settings local to browser (localStorage)