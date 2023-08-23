import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {isNil, times} from 'lodash';
import {GridModel} from '@xh/hoist/cmp/grid';
import {selectEditor} from '@xh/hoist/desktop/cmp/grid';
import {dateIs, lengthIs, numberIs, required, Store} from '@xh/hoist/data';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {customerProps} from './SelectTestPanel';

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
                        })
                },
                {
                    field: 'select, enableFilter False',
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
                    field: 'select async search',
                    editable: true,
                    editor: props =>
                        selectEditor({
                            ...props,
                            bind: 'asyncCreatableValue3',
                            inputProps: {
                                ...customerProps
                            }
                        })
                }
                // {
                //     field: 'date',
                //     ...localDateCol,
                //     editable: ifNotRestricted
                // editor: props =>
                //     dateEditor({
                //         ...props,
                //         inputProps: {
                //             valueType: 'localDate'
                //         }
                //     }),
                // tooltip: v => fmtDate(v, 'dddd MMMM Do YYYY')
                // },
                // {
                // field: 'description',
                // width: 300,
                // tooltip: true,
                // editor: textAreaEditor,
                // editorIsPopup: true
                // omit: this.fullRowEditing
                // }
            ]
        });
    }

    async queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }

    private createStore() {
        return new Store({
            validationIsComplex: false,
            fields: [
                {
                    name: 'name',
                    type: 'string',
                    rules: [required, lengthIs({max: 15})]
                },
                {
                    name: 'select',
                    type: 'string',
                    rules: [required]
                },
                {
                    name: 'amount',
                    type: 'number',
                    rules: [
                        required,
                        numberIs({min: 0, max: 100}),
                        {
                            when: (f, {category}) => category === 'US',
                            check: async ({value}) => {
                                // if (this.asyncValidation) await wait(1000);
                                return isNil(value) || value < 10
                                    ? 'Records where `category` is "US" require `amount` of 10 or greater.'
                                    : null;
                            }
                        }
                    ]
                },
                {
                    name: 'date',
                    type: 'localDate',
                    rules: [dateIs({min: LocalDate.today().startOfYear(), max: 'today'})]
                },
                {
                    name: 'restricted',
                    type: 'bool',
                    defaultValue: false
                },
                {
                    name: 'category',
                    type: 'string',
                    rules: [required]
                },
                {
                    name: 'description',
                    type: 'string',
                    rules: [lengthIs({max: 280})]
                }
            ],
            data: [
                {
                    id: 0,
                    name: 'Record 0',
                    select: 'US',
                    category: 'US',
                    amount: 50,
                    date: LocalDate.today(),
                    description: 'This is a record'
                }
            ]
        });
    }
}
