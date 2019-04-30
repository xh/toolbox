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
import {managed} from '@xh/hoist/core/mixins';
import {span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';

import {DetailsPanelModel} from './DetailsPanelModel';

@HoistModel
@LoadSupport
export class RecallsPanelModel {

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
                field: 'recallDate', // <~ never want to change
                ...dateCol, // <~ XH convention to spread framework column 2nd line
                renderer: dateRenderer('MMM D'),
                headerName: 'Recalling since',
                width: 130
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
                field: 'classification',
                width: 100,
                tooltip: (val) => `${val} ${val === 'Not Yet Classified' ? '' : 'Click for more details' }`,
                elementRenderer: this.classificationRenderer
            },
            {
                field: 'status',
                width: 150,
            },
            {
                field: 'description',
                width: 400,
                hidden: true
            }
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.gridModel.selModel.singleRecord,
            run: (rec) => this.detailsPanelModel.setRecord(rec)
            // ^ addReaction.run BOGO:
            //   run takes a callback function that is given
        });
    }


    //------------------------
    // Implementation
    //------------------------


    // provided by @LoadSupport
    async doLoadAsync(loadSpec) {
        await XH
            .fetchJson({url: 'recalls', loadSpec})  // no forward slash == relative path
            .then(rxRecallEntries => {
                console.log(rxRecallEntries);
                // console log displays the data that has been mutated!
                // if want to see original state, use `JSON.stringify()`
                this.gridModel.loadData(rxRecallEntries);
            })
            .catchDefault();
    }

    processRecord(rawRec) {
        return {
            ...rawRec,
            brandName: rawRec.openfda.brand_name[0],
            genericName: rawRec.openfda.generic_name[0],
            recallDate: moment(rawRec.recall_initiation_date).toDate(),
            description: rawRec.product_description
        };
    }

    createId(record) {
        return record.brandName + record.recall_number;
    }

    classificationRenderer(val) {
        switch (val) {
            case 'Class I':
                return span(Icon.skull(), Icon.skull(), Icon.skull());
            case 'Class II':
                return span(Icon.skull(), Icon.skull());
            case 'Class III':
                return Icon.skull();
            default:
                return Icon.question();
        }
    }


    // make an export button


}

// Hoist builds on top of AG Grid to let you do common tasks as one liners
// aka POWERFUL!  we do EXTREMELY HEAVY LIFTING!
// *remember user preferences / sort*
//      - settings local to browser (localStorage)