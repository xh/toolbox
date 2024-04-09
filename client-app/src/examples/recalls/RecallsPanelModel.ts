import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {uniqBy} from 'lodash';
import {PERSIST_APP} from './AppModel';
import {DetailsPanelModel} from './detail/DetailsPanelModel';

export class RecallsPanelModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @bindable
    searchQuery: string = '';

    @bindable
    @persist
    groupBy: string = null;

    @managed
    detailsPanelModel = new DetailsPanelModel();

    @managed
    gridModel = new GridModel({
        printSupport: true,
        store: {
            processRawData: this.processRecord,
            fields: [
                {name: 'classification', type: 'string'},
                {name: 'brandName', type: 'string'},
                {name: 'genericName', type: 'string'},
                {name: 'status', type: 'string'},
                {name: 'recallingFirm', type: 'string'},
                {name: 'recallDate', type: 'localDate'},
                {name: 'description', type: 'string'},
                {name: 'reason', type: 'string'}
            ]
        },
        emptyText: 'No records found...',
        colChooserModel: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        persistWith: this.persistWith,
        columns: [
            {
                field: 'classification',
                headerName: 'Class',
                align: 'center',
                width: 65,
                tooltip: cls => cls,
                renderer: this.classificationRenderer
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
                renderer: compactDateRenderer()
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
        super();
        makeObservable(this);

        const {gridModel} = this;
        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: rec => (this.detailsPanelModel.currentRecord = rec)
        });

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            debounce: ONE_SECOND
        });

        this.addReaction({
            track: () => this.groupBy,
            run: selectedGroup => gridModel.setGroupBy(selectedGroup)
        });

        const {groupBy} = gridModel;
        this.groupBy = groupBy && groupBy.length > 0 ? groupBy[0] : null;
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec) {
        const {gridModel} = this;

        try {
            let entries = await XH.fetchJson({
                url: 'recalls',
                params: {searchQuery: this.searchQuery},
                loadSpec
            });

            if (loadSpec.isStale) return;

            // Approximate (and enforce) a unique id for this rather opaque API
            entries.forEach(it => {
                it.id = it.openfda.brand_name[0] + it.recall_number;
            });
            entries = uniqBy(entries, 'id');

            gridModel.loadData(entries);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    private processRecord(rawRec) {
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

    private classificationRenderer(val: string) {
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
