import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {FieldType} from '@xh/hoist/data';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {cloneDeep} from 'lodash';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {GridTestData} from './GridTestData';
import {GridTestMetrics} from './GridTestMetrics';

const pnlColumn = {
    absSort: true,
    align: 'right',
    width: 120,
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true,
        tooltip: true
    })
};

export class GridTestModel extends HoistModel {

    persistWith = {localStorageKey: 'persistTest'};

    // Total count (approx) of all nodes generated (parents + children).
    @bindable recordCount = 200000;
    // Number of random records to perturb
    @bindable twiddleCount = Math.round(this.recordCount * .50);
    // Prefix for all IDs - change to ensure no IDs re-used across data gens.
    @bindable idSeed = 1;
    // True to generate data in tree structure.
    @bindable tree = false;
    // True to show summary row.
    @bindable showSummary = false;
    // True to use tree root node as summary row.
    @bindable loadRootAsSummary = false;
    // True to turn off default XSS protection at store level.
    @bindable disableXssProtection = true;
    // Value > 0 will trigger creation of additional (null value) fields on the store to
    // help stress-test stores with a wide array of fields.
    @bindable extraFieldCount = 50;

    @bindable disableSelect = false;

    @bindable colChooserCommitOnChange = true;
    @bindable colChooserShowRestoreDefaults = true;
    @bindable colChooserWidth = null;
    @bindable colChooserHeight = null;

    @bindable lockColumnGroups = true;

    @bindable
    @persist
    autosizeMode = 'onDemand';

    @bindable
    @persist.with({path: 'gridPersistType', buffer: 500})  // test persist.with!
    persistType = null;

    @managed
    data = new GridTestData();

    @managed
    metrics = new GridTestMetrics();

    @managed
    @observable.ref
    gridModel;

    constructor() {
        super();
        makeObservable(this);
        this.markPersist('tree');
        this.markPersist('showSummary');
        this.gridModel = this.createGridModel();
        this.addReaction({
            track: () =>  [
                this.tree,
                this.showSummary,
                this.loadRootAsSummary,
                this.disableSelect,
                this.autosizeMode,
                this.persistType,
                this.colChooserCommitOnChange,
                this.colChooserShowRestoreDefaults,
                this.colChooserWidth,
                this.colChooserHeight,
                this.lockColumnGroups,
                this.disableXssProtection,
                this.extraFieldCount
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.clearData();
                this.loadAsync();
            },
            debounce: 100
        });
        window.gm = this;

        this.addReaction({
            track: () =>  this.recordCount,
            run: () => this.clearData()
        });
    }

    clearData() {
        this.data.clear();
        this.metrics.clear();
    }

    async doLoadAsync(loadSpec) {
        const {data, metrics, gridModel} = this;
        if (loadSpec.isAutoRefresh) return; // avoid auto-refresh confusing our tests here

        if (data.isEmpty) {
            data.generate(this);
        }
        metrics.runAsLoad(() => {
            gridModel.loadData(cloneDeep(data.rows), cloneDeep(data.summary));
        });
    }

    clearGrid() {
        this.metrics.clear();
        this.metrics.runAsLoad(() => {
            this.gridModel.clear();
        });
    }

    twiddleData(mode) {
        const {gridModel, data, twiddleCount, metrics} = this;
        metrics.runAsUpdate(() => {
            if (mode === 'update') {
                const update = data.generateUpdates(twiddleCount);
                gridModel.updateData(update);
            } else {
                data.applyUpdates(twiddleCount);
                gridModel.loadData(cloneDeep(data.rows), cloneDeep(data.summary));
            }
        });
    }

    createGridModel() {
        const {persistType, disableXssProtection, extraFieldCount} = this,
            storeConf = {
                freezeData: false,
                idEncodesTreePath: true
            };

        if (disableXssProtection) {
            storeConf.fieldDefaults = {disableXssProtection};
        }

        if (this.tree && this.showSummary && this.loadRootAsSummary) {
            storeConf.loadRootAsSummary = true;
        }

        const FT = FieldType;
        storeConf.fields = [
            {name: 'symbol', type: FT.STRING},
            {name: 'trader', type: FT.STRING},
            {name: 'day', type: FT.NUMBER},
            {name: 'mtd', displayName: 'MTD', type: FT.NUMBER},
            {name: 'ytd', displayName: 'YTD', type: FT.NUMBER},
            {name: 'volume', type: FT.NUMBER}
        ];

        if (extraFieldCount > 0) {
            for (let i = 0; i <= extraFieldCount; i++) {
                storeConf.fields.push({
                    name: 'extraField' + i
                });
            }
        }

        return new GridModel({
            persistWith: persistType ? {[persistType]: 'persistTest'} : null,
            selModel: {mode: 'multiple'},
            sortBy: 'id',
            emptyText: 'No records found...',
            enableExport: true,
            lockColumnGroups: this.lockColumnGroups,
            store: storeConf,
            treeMode: this.tree,
            showSummary: this.showSummary,
            colChooserModel: {
                commitOnChange: this.colChooserCommitOnChange,
                showRestoreDefaults: this.colChooserShowRestoreDefaults,
                width: this.colChooserWidth ?? undefined,
                height: this.colChooserHeight ?? undefined
            },
            autosizeOptions: {
                mode: this.autosizeMode
            },
            columns: [
                {
                    field: 'id',
                    width: 140,
                    isTreeColumn: this.tree
                },
                {
                    field: 'symbol',
                    agOptions: {
                        filter: 'agTextColumnFilter',
                        suppressMenu: false
                    },
                    width: 200
                },
                {
                    field: 'trader',
                    width: 200
                },
                {
                    groupId: 'pnl',
                    headerName: 'P&L',
                    children: [
                        {field: 'day', highlightOnChange: true, ...pnlColumn},
                        {field: 'mtd', ...pnlColumn},
                        {field: 'ytd', ...pnlColumn}
                    ]
                },
                {
                    field: 'volume',
                    align: 'right',
                    width: 130,
                    highlightOnChange: true,
                    renderer: millionsRenderer({
                        precision: 2,
                        label: true,
                        tooltip: true
                    })
                },
                {
                    field: 'complex',
                    align: 'right',
                    width: 130,
                    renderer: (v, {record}) => {
                        return fmtMillions(record.data.volume, {precision: 2, label: true}) +
                            ' | ' +
                            fmtNumber(record.data.day, {colorSpec: true});
                    },
                    rendererIsComplex: true
                }
            ]
        });
    }

    @action
    tearDown() {
        XH.safeDestroy(this.gridModel);
        this.gridModel = this.createGridModel();
        this.data.clear();
        this.runTimes = {};
    }
}
