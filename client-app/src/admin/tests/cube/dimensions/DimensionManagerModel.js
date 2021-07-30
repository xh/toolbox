import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {cloneDeep, isEmpty, isEqual, pullAllWith, unionWith} from 'lodash';

export class DimensionManagerModel extends HoistModel {

    @observable.ref value = [];

    defaultDims;
    userDims;
    userDimPref;

    @managed groupingChooserModel;
    @managed gridModel;

    constructor(config) {
        super();
        makeObservable(this);

        this.defaultDims = config.defaultDimConfig ? XH.getConf(config.defaultDimConfig) : [];
        this.groupingChooserModel = new GroupingChooserModel({
            dimensions: config.dimensions,
            initialValue: this.defaultDims[0]
        });

        this.gridModel = new GridModel({
            groupBy: 'type',
            sortBy: 'displayName',
            hideHeaders: true,
            columns: [
                {field: 'displayName', flex: 1},
                {field: 'type', hidden: true}
            ],
            contextMenu: [
                {
                    text: 'Delete custom grouping',
                    icon: Icon.delete(),
                    actionFn: () => this.deleteSelected(),
                    displayFn: ({record}) => {
                        return {disabled: !record || record.data.type == 'Default'};
                    }
                }
            ]
        });

        this.addReaction({
            track: () => this.selection,
            run: (rec) => this.onSelectionChange(rec)
        });

        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: (val) => this.onDimChooserValChange(val)
        });

        this.userDimPref = config.userDimPref;
        const userDims = this.userDimPref ? XH.getPref(this.userDimPref) : [];
        this.setUserDims(userDims);  // populates the grid
    }

    @action
    setValue(val) {
        this.value = val;
        this.groupingChooserModel.setValue(val);
    }

    @action
    onSelectionChange(rec) {
        if (rec) this.setValue(this.decodeOptId(rec.id));
    }

    onDimChooserValChange(val) {
        if (isEmpty(val)) return;

        const {gridModel} = this,
            newId = this.encodeOptId(val),
            existingOpt = gridModel.store.getById(newId);

        // If selection is already an option, simply select it.
        if (existingOpt) {
            gridModel.selModel.select(existingOpt);
            return;
        }

        // Otherwise update user dims, triggering selection of new value.
        const newDims = unionWith([val], this.userDims, isEqual);
        this.setUserDims(newDims, newId);

        // Reset chooser for next show.
        this.groupingChooserModel.setValue([]);
    }

    get formattedDimensions() {return this.formatDimensions(this.value)}

    get selection() {return this.gridModel.selectedRecord}

    get enableDelete() {
        return this.selection && this.selection.type != 'Default';
    }

    populateGrid(idToSelect) {
        const {defaultRowData, userRowData, gridModel} = this;

        gridModel.loadData([...defaultRowData, ...userRowData]);

        wait(300).then(() => {
            if (idToSelect) {
                gridModel.selectAsync(idToSelect);
            } else  {
                gridModel.preSelectFirstAsync();
            }
        });
    }

    deleteSelected() {
        if (!this.enableDelete) return;

        const {selection, userDims} = this,
            dimsToDelete = this.decodeOptId(selection.id),
            dimsCopy = cloneDeep(userDims),
            newDims = pullAllWith(dimsCopy, [dimsToDelete], isEqual);

        this.setUserDims(newDims);
    }

    setUserDims(dims, idToSelect = null) {
        this.userDims = dims;
        this.populateGrid(idToSelect);

        if (this.userDimPref) {
            XH.setPref(this.userDimPref, dims);
        }
    }

    get defaultRowData() {
        return this.defaultDims.map(dims => {
            return {
                id: this.encodeOptId(dims),
                displayName: this.formatDimensions(dims),
                type: 'Default'
            };
        });
    }

    get userRowData() {
        return this.userDims.map(dims => {
            return {
                id: this.encodeOptId(dims),
                displayName: this.formatDimensions(dims),
                type: 'Custom'
            };
        });
    }

    decodeOptId(id) {
        return id.split('>>');
    }

    encodeOptId(dims) {
        return dims.join('>>');
    }

    formatDimensions(dims) {
        return dims.map(dim => this.groupingChooserModel.getDimDisplayName(dim)).join(' › ');
    }

}
