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
            idSpec: 'recall_number'
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
                headerName: 'Recall Initiation Date',
                width: 150
                // hidden: true
            },
            {
                field: 'product_description',
                width: 150
                // hidden: true
            },
            {
                field: 'status',
                width: 400
                // hidden: true
            }
            // {
            //     field: 'recall_initiation_date',
            //     headerName: 'Recall Initiation Date',
            //     width: 150,
            //     // hidden: true
            // }
        ]
    })


    constructor() {

    }

    async doLoadAsync(loadSpec) {
        await XH
        //
        // now that I know how the backend is, I think that 'recalls'
        // is referring to our backend/recalls
            .fetchJson({url: 'recalls', loadSpec})  // no forward slash == relative path
            .wait(100)
            .then(rxRecallEntries => {
                console.log(rxRecallEntries);
                //
                // console log displays the data that has been mutated!
                // can use JSON.stringify() to see original at this line...
                //
                this.gridModel.loadData(rxRecallEntries);
            });
    }

    //------------------------
    // Implementation
    //------------------------

}