import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
// import {compactDateRenderer} from '@xh/hoist/format';
// import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
// import {uniqBy} from 'lodash';
// import {PERSIST_APP} from './AppModel';
// import {DetailsPanelModel} from './detail/DetailsPanelModel';

export class DirectoryPanelModel extends HoistModel {

    // persistWith = PERSIST_APP;

    @bindable
    searchQuery = '';

    // @bindable
    // @persist
    // groupBy = null;

    @managed
    // detailsPanelModel = new DetailsPanelModel();

    @managed
    gridModel = new GridModel({
        store: {
            processRawData: this.processRecord,
            fields: [{
                name: 'name',
                location: 'location'
            }]
        },
        emptyText: 'No records found...',
        colChooserModel: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        persistWith: this.persistWith,
        columns: [
            // {
            //     field: 'name',
            //     headerName: 'Name',
            //     align: 'center',
            //     width: 65,
            //     tooltip: (cls) => cls,
            //     elementRenderer: this.classificationRenderer
            // },
            {
                field: 'name',
                width: 300
            },
            {
                field: 'location',
                width: 300,
                hidden: true
            }
            // {
            //     field: 'recallDate',
            //     ...localDateCol,
            //     headerName: 'Date',
            //     width: 100,
            //     renderer: compactDateRenderer('MMM D')
            // }
        ]
    });

    constructor() {
        super();
        makeObservable(this);

        const {gridModel} = this;
        // this.addReaction({
        //     track: () => gridModel.selectedRecord,
        //     run: (rec) => this.detailsPanelModel.setCurrentRecord(rec)
        // });

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            debounce: ONE_SECOND
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
        // const {gridModel} = this;
        //
        // let entries = [
        //     {
        //         name: 'Anselm',
        //         location: 'California'
        //     },
        //     {
        //         name: 'Lee',
        //         location: 'New York'
        //     }
        // ];

        // try {
        //     let entries = await XH.fetchJson({
        //         url: 'recalls',
        //         params: {searchQuery: this.searchQuery},
        //         loadSpec
        //     });
        //
        //     if (loadSpec.isStale) return;
        //
        //     // Approximate (and enforce) a unique id for this rather opaque API
        //     entries.forEach(it => {
        //         it.id = it.openfda.brand_name[0] + it.recall_number;
        //     });
        //     entries = uniqBy(entries, 'id');
        //
        //     gridModel.loadData(entries);
        //     await gridModel.preSelectFirstAsync();
        // } catch (e) {
        //     XH.handleException(e);
        // }
    }

    // processRecord(rawRec) {
    //     return {
    //         ...rawRec,
    //         brandName: rawRec.openfda.brand_name[0],
    //         genericName: rawRec.openfda.generic_name[0],
    //         recallDate: rawRec.recall_initiation_date,
    //         description: rawRec.product_description,
    //         recallingFirm: rawRec.recalling_firm,
    //         reason: rawRec.reason_for_recall
    //     };
    // }
    //
    // classificationRenderer(val) {
    //     switch (val) {
    //         case 'Class I':
    //             return Icon.skull({className: 'xh-red'});
    //         case 'Class II':
    //             return Icon.warning({className: 'xh-orange'});
    //         case 'Class III':
    //             return Icon.info({className: 'xh-blue'});
    //         default:
    //             return null;
    //     }
    // }
}