import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common';
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
                '`hideable: false`. Open the chooser from the toolbar - as a **popover** via the grid’s',
                '`colChooserModel`, or as a **docked side-panel** via its `colChooserPanelModel `, which',
                'the grid renders beside itself (shown open here by default).'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ColumnChooserPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/Types.ts',
                    text: 'ColChooserConfig',
                    notes: 'Config options shared by the popover, dialog, and docked-panel choosers.'
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
            // Chooser config is applied at GridModel construction, so every option here rebuilds the
            // model (see ColumnChooserPanelModel). Modal (popover/dialog) and docked-panel choosers
            // are configured independently, so their options are grouped separately below.
            options: [
                wrapperOptionGroup('Grid'),
                wrapperOption({
                    label: 'Lock column groups',
                    info: 'Keeps each group’s visible members contiguous - a group can’t be split apart.',
                    propName: 'GridModel.lockColumnGroups',
                    control: switchInput({model, bind: 'lockColumnGroups'})
                }),
                wrapperOptionGroup('Modal Chooser (Popover / Dialog)'),
                wrapperOption({
                    label: 'Column Library',
                    info: 'Show the docked Column Library of hidden columns to drag in and out.',
                    propName: 'ColChooserConfig.columnLibraryEnabled',
                    control: switchInput({model, bind: 'modalColumnLibraryEnabled'})
                }),
                wrapperOption({
                    label: 'Restore Defaults',
                    info: 'Show the button that reverts all column, grouping, and sort state to defaults.',
                    propName: 'ColChooserConfig.showRestoreDefaults',
                    control: switchInput({model, bind: 'modalShowRestoreDefaults'})
                }),
                wrapperOption({
                    label: 'Commit on Change',
                    info: 'Apply edits to the grid immediately; off adds a Save button to commit on demand.',
                    propName: 'ColChooserConfig.commitOnChange',
                    control: switchInput({model, bind: 'modalCommitOnChange'})
                }),
                wrapperOptionGroup('Panel Chooser (Docked)'),
                wrapperOption({
                    label: 'Column Library',
                    info: 'Show the docked Column Library of hidden columns to drag in and out.',
                    propName: 'ColChooserConfig.columnLibraryEnabled',
                    control: switchInput({model, bind: 'panelColumnLibraryEnabled'})
                }),
                wrapperOption({
                    label: 'Restore Defaults',
                    info: 'Show the button that reverts all column, grouping, and sort state to defaults.',
                    propName: 'ColChooserConfig.showRestoreDefaults',
                    control: switchInput({model, bind: 'panelShowRestoreDefaults'})
                })
            ],
            item: panel({
                title: 'Grids › Column Chooser',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                // The grid renders its docked `colChooserPanelModel ` beside itself - no manual embed.
                item: grid({model: model.gridModel}),
                bbar: [
                    storeFilterField({gridModel: model.gridModel}),
                    filler(),
                    colChooserButton({
                        gridModel: model.gridModel,
                        text: 'Choose Columns (Popover)'
                    }),
                    colChooserButton({
                        gridModel: model.gridModel,
                        target: 'panel',
                        text: 'Choose Columns (Panel)'
                    }),
                    exportButton({gridModel: model.gridModel})
                ]
            })
        });
    }
});

class ColumnChooserPanelModel extends HoistModel {
    @managed @observable.ref gridModel: GridModel;

    @bindable lockColumnGroups: boolean = true;

    // Modal (popover / dialog) chooser config -> gridModel.colChooserModel.
    @bindable modalColumnLibraryEnabled: boolean = true;
    @bindable modalShowRestoreDefaults: boolean = true;
    @bindable modalCommitOnChange: boolean = true;

    // Docked side-panel chooser config -> gridModel.colChooserPanelModel . Note the panel forces
    // commitOnChange true, so no such option is exposed for it.
    @bindable panelColumnLibraryEnabled: boolean = true;
    @bindable panelShowRestoreDefaults: boolean = true;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel();

        // All of the above are construction-time GridModel / chooser configs, so rebuild the model
        // (and the choosers bound to it) whenever any of them change.
        this.addReaction({
            track: () => [
                this.lockColumnGroups,
                this.modalColumnLibraryEnabled,
                this.modalShowRestoreDefaults,
                this.modalCommitOnChange,
                this.panelColumnLibraryEnabled,
                this.panelShowRestoreDefaults
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.loadAsync().catchDefault();
            }
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const sales = await XH.fetchJson({url: 'sales', loadSpec});
        this.gridModel.loadData(sales);
    }

    private createGridModel(): GridModel {
        return new GridModel({
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: {
                columnLibraryEnabled: this.modalColumnLibraryEnabled,
                showRestoreDefaults: this.modalShowRestoreDefaults,
                commitOnChange: this.modalCommitOnChange,
                width: 620
            },
            colChooserPanelModel: {
                columnLibraryEnabled: this.panelColumnLibraryEnabled,
                showRestoreDefaults: this.panelShowRestoreDefaults,
                panelConfig: {defaultSize: 620, defaultCollapsed: false}
            },
            enableExport: true,
            lockColumnGroups: this.lockColumnGroups,
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
