/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';

@HoistModel
@LoadSupport
export class RecallsPanelModel {

    gridModel = new GridModel({
        // sortBy: 'pnl|desc|abs',
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
        // stateModel: 'portfolio-positions-grid',
        // stateModel is user preference for positions of grid sort
        columns: [
            {
                field: 'recall_initiation_date',
                // want to format ^ field
                headerName: 'Recalling as of',
                width: 100,
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
    })


    constructor() {

    }

    //------------------------
    // Implementation
    //------------------------

    async doLoadAsync(loadSpec) {
        await XH
        //
        // now that I know how the backend is, I think 'recalls'
        // is referring to our backend/recalls
            .fetchJson({url: 'recalls', loadSpec})  // no forward slash == relative path
            .wait(100)
            .then(rxRecallEntries => {
                console.log(rxRecallEntries);
                //
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
        // rawRec.recallInitDateWithFormat = rawRec.recall_initiation_date.toDateString()
    }

    createId(record) {
        return record.brandName + record.recall_number;
    }

    formatDate(dateString) {

        // 04/18:
        //
        // use `.toDateString()`
        //      OR
        // a lodash method...?
        //      OR
        // doesn't our library come wih something something date...?

    }


}