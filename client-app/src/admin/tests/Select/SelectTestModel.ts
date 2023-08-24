import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {times} from 'lodash';
import {GridModel} from '@xh/hoist/cmp/grid';
import {selectEditor} from '@xh/hoist/desktop/cmp/grid';
import {Store} from '@xh/hoist/data';
import {customerProps} from './SelectTestPanel';
import {wait} from '@xh/hoist/promise';

export class SelectTestModel extends HoistModel {
    @bindable
    selectValue: string;

    @bindable
    creatableValue: string;

    @bindable
    asyncValue: number;

    @bindable
    asyncCreatableValue: number;

    @bindable
    clicksToEdit = 2;

    @bindable
    fullRowEditing = false;

    @managed
    gridModel: GridModel;

    @bindable
    groupedValue: string;

    @bindable.ref
    objectValue: PlainObject;

    @bindable
    bigValue: number;

    @bindable
    selectOnFocusValue: PlainObject;

    @bindable
    noFilterValue: number;

    @bindable
    numOptions = 1000;

    @observable
    bigOptions;

    @bindable
    asyncCreatableValue2: number;

    @bindable
    asyncCreatableValue3: number;

    @bindable.ref
    objectValue2: PlainObject;

    @managed
    store: Store;

    @bindable.ref
    enableMultiLeftIcon: string[];

    @bindable.ref
    enableMultiMenuOpen: string[];

    constructor() {
        super();
        makeObservable(this);
        this.store = this.createStore();
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.numOptions,
            run: () => (this.bigOptions = times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });

        this.addReaction({
            track: () => [this.fullRowEditing, this.clicksToEdit],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
            }
        });
    }

    private createGridModel() {
        return new GridModel({
            selModel: null,
            showCellFocus: true,
            cellBorders: true,
            stripeRows: false,
            fullRowEditing: this.fullRowEditing,
            clicksToEdit: this.clicksToEdit,
            store: this.store,
            columns: [
                {
                    field: 'select',
                    minWidth: 120,
                    editable: true,
                    editor: props =>
                        selectEditor({
                            ...props,
                            inputProps: {
                                options: ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']
                            }
                        }),
                    agOptions: {
                        suppressKeyboardEvent: ({event, api}) => {
                            if (event.key === 'Enter') {
                                wait(50).then(() => api.stopEditing());
                                return true;
                            }
                            return false;
                        }
                    }
                },
                {
                    field: 'selectEnableFilterFalse',
                    editable: true,
                    editor: props =>
                        selectEditor({
                            ...props,
                            inputProps: {
                                enableFilter: false,
                                openMenuOnFocus: true,
                                options: ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']
                            }
                        })
                },
                {
                    field: 'selectAsyncSearch',
                    editable: true,
                    editor: props =>
                        selectEditor({
                            ...props,
                            inputProps: {
                                ...customerProps('company')
                            }
                        })
                }
            ]
        });
    }

    private createStore() {
        return new Store({
            validationIsComplex: false,
            fields: [
                {
                    name: 'select',
                    type: 'string'
                },
                {
                    name: 'selectEnableFilterFalse',
                    type: 'string'
                },
                {
                    name: 'selectAsyncSearch',
                    type: 'string'
                }
            ],
            // TODO - values not editable with keys (arrows, enter) when these are inputted
            data: [
                {
                    id: 0,
                    select: 'US',
                    selectEnableFilterFalse: 'BRIC',
                    selectAsyncSearch: ''
                }
            ]
        });
    }
}
