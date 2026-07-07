import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {columnChooser} from '@xh/hoist/desktop/cmp/grid';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wrapper, wrapperOption} from '../../common';
import {
    actualGrossCol,
    actualUnitsSoldCol,
    cityCol,
    commissionCol,
    commissionRateCol,
    emailCol,
    firstNameCol,
    fullNameCol,
    lastNameCol,
    projectedGrossCol,
    projectedUnitsSoldCol,
    regionCol,
    retainCol,
    salaryCol,
    stateCol,
    tenureCol
} from '../../../core/columns';

export const columnChooserPanel = hoistCmp.factory({
    model: creates(() => ColumnChooserPanelModel),
    render({model}) {
        return wrapper({
            title: 'Column Chooser',
            icon: Icon.gridPanel(),
            description: [
                'The redesigned `ColumnChooser` manages a grid’s columns by drag-and-drop across three',
                'buckets - **pinned left**, **unpinned**, and **pinned right**. Drag to reorder within',
                'a bucket, or across buckets to pin and unpin.',
                '',
                'The optional **Column Library** lists hidden columns grouped by `chooserGroup` -',
                'drag columns out to show them, or in to hide them. Note that `chooserGroup` groups',
                'the Library only; the buckets follow the grid’s real `ColumnGroup` structure.',
                '',
                'Columns carry `chooserDescription` tooltips, and `Full Name` is locked via',
                '`hideable: false`. The chooser also opens from the toolbar’s `colChooserButton` -',
                'showing it beside the grid is just a demo convenience.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ColumnChooserPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/grid/columnchooser/ColumnChooser.ts',
                    text: 'ColumnChooser',
                    notes: 'The standalone column chooser component and its props.'
                },
                {
                    url: '$HR/cmp/grid/columns/Column.ts',
                    text: 'Column config',
                    notes: 'Per-column options controlling how each column appears in the chooser.'
                },
                {
                    url: '$HR/cmp/grid/GridModel.ts',
                    text: 'GridModel',
                    notes: 'Grid-level configuration for the chooser and column-group locking.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Show chooser beside grid',
                    info: 'Demo aid only - a real app opens the chooser from the toolbar button or context menu.',
                    control: switchInput({model, bind: 'showEmbeddedChooser'})
                }),
                wrapperOption({
                    label: 'Lock column groups',
                    info: 'Keeps each group’s visible members contiguous - a group can’t be split apart.',
                    propName: 'GridModel.lockColumnGroups',
                    control: switchInput({model, bind: 'lockColumnGroups'})
                })
            ],
            item: panel({
                title: 'Grids › Column Chooser',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                item: hframe(
                    panel({
                        flex: 1,
                        item: grid({model: model.gridModel}),
                        bbar: [
                            storeFilterField({gridModel: model.gridModel}),
                            filler(),
                            colChooserButton({gridModel: model.gridModel}),
                            exportButton({gridModel: model.gridModel})
                        ]
                    }),
                    panel({
                        omit: !model.showEmbeddedChooser,
                        className: 'xh-border-left',
                        width: 780,
                        item: columnChooser({
                            gridModel: model.gridModel,
                            showColumnLibrary: true,
                            flex: 1
                        })
                    })
                )
            })
        });
    }
});

class ColumnChooserPanelModel extends HoistModel {
    @managed @observable.ref gridModel: GridModel;
    @bindable lockColumnGroups: boolean = true;

    // Demo-only affordance: render the standalone chooser beside the grid. A real app would
    // typically expose the chooser on demand via the toolbar's colChooserButton instead.
    @bindable showEmbeddedChooser: boolean = true;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel(this.lockColumnGroups);

        // lockColumnGroups is a construction-time GridModel config, so rebuild the model (and the
        // choosers bound to it) whenever the user toggles it.
        this.addReaction({
            track: () => this.lockColumnGroups,
            run: lockColumnGroups => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel(lockColumnGroups);
                this.loadAsync().catchDefault();
            }
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const sales = await XH.fetchJson({url: 'sales', loadSpec});
        this.gridModel.loadData(sales);
    }

    private createGridModel(lockColumnGroups: boolean): GridModel {
        return new GridModel({
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: {showColumnLibrary: true, showRestoreDefaults: true, width: 620},
            enableExport: true,
            lockColumnGroups,
            columns: [
                {
                    groupId: 'rep',
                    headerName: 'Rep',
                    children: [
                        {
                            ...fullNameCol,
                            pinned: 'left',
                            hideable: false,
                            chooserDescription:
                                'First and last name rendered as a single cell. Locked on - cannot be hidden.'
                        },
                        {
                            ...firstNameCol,
                            hidden: true,
                            chooserGroup: 'Rep Details',
                            chooserDescription: 'Given name of the sales rep.'
                        },
                        {
                            ...lastNameCol,
                            hidden: true,
                            chooserGroup: 'Rep Details',
                            chooserDescription: 'Family name of the sales rep.'
                        },
                        {
                            ...emailCol,
                            hidden: true,
                            chooserGroup: 'Rep Details',
                            chooserDescription: 'Work email address, derived from the rep’s name.'
                        }
                    ]
                },
                {
                    groupId: 'location',
                    headerName: 'Location',
                    children: [
                        {
                            ...cityCol,
                            hidden: true,
                            chooserGroup: 'Location',
                            chooserDescription: 'City where the sales rep is based.'
                        },
                        {
                            ...stateCol,
                            chooserGroup: 'Location',
                            chooserDescription: 'US state where the sales rep is based.'
                        },
                        {
                            ...regionCol,
                            hidden: true,
                            chooserGroup: 'Location',
                            chooserDescription: 'US Census region derived from the rep’s state.'
                        }
                    ]
                },
                {
                    ...salaryCol,
                    chooserGroup: 'Compensation',
                    chooserDescription: 'Base annual salary in USD, excluding commission.'
                },
                {
                    ...tenureCol,
                    hidden: true,
                    chooserGroup: 'Rep Details',
                    chooserDescription: 'Years the rep has been with the company.'
                },
                {
                    groupId: 'sales',
                    headerName: 'Sales',
                    headerAlign: 'center',
                    children: [
                        {
                            groupId: 'projected',
                            headerName: 'Projected',
                            headerAlign: 'center',
                            borders: false,
                            children: [
                                {
                                    ...projectedUnitsSoldCol,
                                    chooserGroup: 'Performance',
                                    chooserDescription:
                                        'Forecasted unit count for the year, set at its start.'
                                },
                                {
                                    ...projectedGrossCol,
                                    chooserGroup: 'Performance',
                                    chooserDescription:
                                        'Forecasted gross revenue (USD) from projected units.'
                                }
                            ]
                        },
                        {
                            groupId: 'actual',
                            headerName: 'Actual',
                            headerAlign: 'center',
                            borders: false,
                            children: [
                                {
                                    ...actualUnitsSoldCol,
                                    chooserGroup: 'Performance',
                                    chooserDescription: 'Actual unit count sold to date.'
                                },
                                {
                                    ...actualGrossCol,
                                    chooserGroup: 'Performance',
                                    chooserDescription:
                                        'Actual gross revenue (USD) recognized to date.'
                                }
                            ]
                        }
                    ]
                },
                {
                    groupId: 'compensation',
                    headerName: 'Compensation',
                    headerAlign: 'center',
                    children: [
                        {
                            ...commissionRateCol,
                            hidden: true,
                            chooserGroup: 'Compensation',
                            chooserDescription:
                                'Share of actual gross paid to the rep as commission.'
                        },
                        {
                            ...commissionCol,
                            hidden: true,
                            chooserGroup: 'Compensation',
                            chooserDescription: 'Commission earned to date (actual gross × rate).'
                        }
                    ]
                },
                {
                    ...retainCol,
                    chooserGroup: 'Status',
                    chooserDescription:
                        'Whether the rep should be retained for the next fiscal year.'
                }
            ]
        });
    }
}
