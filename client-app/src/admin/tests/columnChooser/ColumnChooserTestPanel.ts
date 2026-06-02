import {ColumnOrGroupSpec, ColumnSpec, grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {button, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {columnChooser} from '@xh/hoist/desktop/cmp/grid';
import {buttonGroupInput, jsonInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {addColumnDialog, AddColumnDialogModel, AddColumnHost} from './AddColumnDialog';
import {
    collectGroupIds,
    CustomColumn,
    generateGridData,
    GridSize,
    mergeCustomColumns
} from './generateColumns';

export const columnChooserTestPanel = hoistCmp.factory({
    model: creates(() => ColumnChooserTestModel),
    render({model}) {
        return panel({
            title: 'Tests › Column Chooser',
            icon: Icon.gridPanel(),
            tbar: [
                span('Columns'),
                buttonGroupInput({
                    bind: 'size',
                    items: [
                        button({text: 'Small', value: 'small'}),
                        button({text: 'Medium', value: 'medium'}),
                        button({text: 'Large', value: 'large'})
                    ]
                }),
                toolbarSep(),
                switchInput({bind: 'lockColumnGroups', label: 'Lock Groups', labelSide: 'left'}),
                switchInput({bind: 'enableColumnPinning', label: 'Pinning', labelSide: 'left'}),
                toolbarSep(),
                button({
                    text: 'Add Column',
                    icon: Icon.add(),
                    onClick: () => model.addColumnModel.open()
                }),
                filler(),
                storeFilterField({gridModel: model.gridModel}),
                colChooserButton({gridModel: model.gridModel}),
                exportButton({gridModel: model.gridModel})
            ],
            items: [
                hframe(
                    panel({
                        title: 'Embedded Chooser',
                        icon: Icon.gridPanel(),
                        modelConfig: {
                            side: 'left',
                            defaultSize: 340,
                            collapsible: true,
                            resizable: true
                        },
                        item: columnChooser({gridModel: model.gridModel, flex: 1})
                    }),
                    panel({flex: 1, item: grid({model: model.gridModel})}),
                    panel({
                        title: 'Column State',
                        icon: Icon.json(),
                        modelConfig: {
                            side: 'right',
                            defaultSize: 380,
                            collapsible: true,
                            resizable: true
                        },
                        item: jsonInput({
                            value: model.columnStateJson,
                            readonly: true,
                            language: 'json',
                            flex: 1,
                            width: '100%'
                        })
                    })
                ),
                addColumnDialog({model: model.addColumnModel})
            ]
        });
    }
});

class ColumnChooserTestModel extends HoistModel implements AddColumnHost {
    @bindable size: GridSize = 'medium';
    @bindable lockColumnGroups = true;
    @bindable enableColumnPinning = true;

    @observable.ref customColumns: CustomColumn[] = [];
    @managed @observable.ref gridModel: GridModel;
    @managed addColumnModel = new AddColumnDialogModel(this);

    private baseColumns: ColumnOrGroupSpec[] = [];
    private records: PlainObject[] = [];

    @computed
    get columnStateJson(): string {
        return JSON.stringify(this.gridModel.columnState, null, 2);
    }

    /** Generated group ids + any new groups created via the Add Column form. */
    get groupIds(): string[] {
        const base = collectGroupIds(this.baseColumns),
            custom = this.customColumns.map(c => c.group).filter(g => g && !base.includes(g));
        return [...base, ...Array.from(new Set(custom))];
    }

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => [
                this.size,
                this.lockColumnGroups,
                this.enableColumnPinning,
                this.customColumns
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.loadAsync().catchDefault();
            }
        });
    }

    addColumn(spec: ColumnSpec, group: string) {
        this.customColumns = [...this.customColumns, {spec, group}];
    }

    override async doLoadAsync() {
        this.gridModel.loadData(this.records);
    }

    private createGridModel(): GridModel {
        const {columns, records} = generateGridData(this.size);
        this.baseColumns = columns;
        this.records = records;
        return new GridModel({
            store: {idSpec: 'id'},
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            lockColumnGroups: this.lockColumnGroups,
            enableColumnPinning: this.enableColumnPinning,
            columns: mergeCustomColumns(columns, this.customColumns)
        });
    }
}
