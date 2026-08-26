import {ColChooserMode, grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, HSide, LoadSpec, managed, XH} from '@xh/hoist/core';
import {FilterMatchMode} from '@xh/hoist/data';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
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
                '`hideable: false`. A grid has one chooser, configured via `colChooserModel`, and',
                '`mode` decides how it appears - a **modal** popover/dialog, or a **docked**',
                'side-panel that the grid renders beside itself (the default here).',
                '',
                '`width` sizes the bucket column alone; the Library adds its own `libraryWidth` when',
                'shown, so the buckets keep a constant width as it toggles - the overlay grows/shrinks,',
                'and the docked panel resizes by the library width (preserving any manual resize).'
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
            // model (see ColumnChooserPanelModel). Some options apply to one `mode` only, as noted.
            options: [
                wrapperOptionGroup('Grid'),
                wrapperOption({
                    label: 'Lock column groups',
                    info: 'Keeps each group’s visible members contiguous - a group can’t be split apart.',
                    propName: 'GridModel.lockColumnGroups',
                    control: switchInput({model, bind: 'lockColumnGroups'})
                }),
                wrapperOption({
                    label: 'Enable Pinning',
                    info: 'Allow users to pin/unpin columns via the grid’s own UI affordances.',
                    propName: 'GridModel.enableColumnPinning',
                    control: switchInput({model, bind: 'enableColumnPinning'})
                }),
                wrapperOption({
                    label: 'Enable Chooser',
                    info: 'Configure a chooser at all - off disables the toolbar button and menu item.',
                    propName: 'GridConfig.colChooserModel',
                    control: switchInput({model, bind: 'enableChooser'})
                }),
                wrapperOptionGroup('Chooser'),
                wrapperOption({
                    label: 'Mode',
                    info: 'Modal shows a popover/dialog above the grid; docked renders a panel beside it.',
                    propName: 'ColChooserConfig.mode',
                    control: select({
                        model,
                        bind: 'mode',
                        width: 100,
                        enableFilter: false,
                        options: [
                            {label: 'Modal', value: 'modal'},
                            {label: 'Docked', value: 'docked'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Width',
                    info: 'Bucket column width - excludes the library, which adds its own width when shown.',
                    propName: 'ColChooserConfig.width',
                    control: numberInput({model, bind: 'width', width: 90, min: 100})
                }),
                wrapperOption({
                    label: 'Height',
                    info: 'Modal only - the dock always fills the grid’s height.',
                    propName: 'ColChooserConfig.height',
                    control: numberInput({model, bind: 'height', width: 90, min: 100})
                }),
                wrapperOption({
                    label: 'Commit on Change',
                    info: 'Modal only - off adds a Save button to commit on demand. The dock always commits.',
                    propName: 'ColChooserConfig.commitOnChange',
                    control: switchInput({model, bind: 'commitOnChange'})
                }),
                wrapperOption({
                    label: 'Side',
                    info: 'Docked only - which side of the grid the dock occupies.',
                    propName: 'ColChooserConfig.panelConfig.side',
                    control: select({
                        model,
                        bind: 'side',
                        width: 100,
                        enableFilter: false,
                        options: [
                            {label: 'Left', value: 'left'},
                            {label: 'Right', value: 'right'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Restore Defaults',
                    info: 'Show the button that reverts all column, grouping, and sort state to defaults.',
                    propName: 'ColChooserConfig.showRestoreDefaults',
                    control: switchInput({model, bind: 'showRestoreDefaults'})
                }),
                wrapperOption({
                    label: 'Autosize on Commit',
                    info: 'Autosize grid columns whenever chooser changes are committed to the grid.',
                    propName: 'ColChooserConfig.autosizeOnCommit',
                    control: switchInput({model, bind: 'autosizeOnCommit'})
                }),
                wrapperOption({
                    label: 'Filter Match Mode',
                    info: 'How the chooser’s filter field matches column names against typed text.',
                    propName: 'ColChooserConfig.filterMatchMode',
                    control: select({
                        model,
                        bind: 'filterMatchMode',
                        width: 150,
                        enableFilter: false,
                        options: [
                            {label: 'Start', value: 'start'},
                            {label: 'Start of word', value: 'startWord'},
                            {label: 'Any', value: 'any'}
                        ]
                    })
                }),
                wrapperOptionGroup('Column Library'),
                wrapperOption({
                    label: 'Enable',
                    info: 'Show the docked Column Library of hidden columns to drag in and out.',
                    propName: 'ColChooserConfig.columnLibrary',
                    control: switchInput({model, bind: 'columnLibraryEnabled'})
                }),
                wrapperOption({
                    label: 'Collapse Groups',
                    info: 'Start the Library’s `chooserGroup` groups collapsed - handy for large column sets.',
                    propName: 'ColLibraryConfig.collapseGroups',
                    control: switchInput({model, bind: 'collapseLibraryGroups'})
                }),
                wrapperOption({
                    label: 'Library Width',
                    info: 'Fixed width of the library, added to the bucket width whenever it is shown.',
                    propName: 'ColLibraryConfig.libraryWidth',
                    control: numberInput({model, bind: 'libraryWidth', width: 90, min: 100})
                })
            ],
            item: panel({
                title: 'Grids › Column Chooser',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                // In docked mode the grid renders the chooser beside itself - no manual embed.
                item: grid({model: model.gridModel}),
                bbar: [
                    storeFilterField({gridModel: model.gridModel}),
                    filler(),
                    colChooserButton({gridModel: model.gridModel, text: 'Choose Columns'}),
                    exportButton({gridModel: model.gridModel})
                ]
            })
        });
    }
});

class ColumnChooserPanelModel extends HoistModel {
    @managed @observable.ref gridModel: GridModel;

    @bindable lockColumnGroups: boolean = true;
    @bindable enableColumnPinning: boolean = true;
    @bindable enableChooser: boolean = true;

    // Chooser config -> gridModel.colChooserModel. `width` is the bucket column width, excluding the
    // library, which adds `libraryWidth` when shown. `height` and `commitOnChange` apply to the modal
    // presentation only; `side` to the docked one, whose open/close is driven externally (the toolbar
    // button, the context menu, or the initial open below).
    @bindable mode: ColChooserMode = 'docked';
    @bindable width: number = 400;
    @bindable height: number = 600;
    @bindable commitOnChange: boolean = true;
    @bindable side: HSide = 'right';
    @bindable showRestoreDefaults: boolean = true;
    @bindable autosizeOnCommit: boolean = false;
    @bindable filterMatchMode: FilterMatchMode = 'startWord';

    // Column Library, added to the bucket `width` whenever it is shown (ColLibraryConfig).
    @bindable columnLibraryEnabled: boolean = true;
    @bindable collapseLibraryGroups: boolean = false;
    @bindable libraryWidth: number = 260;

    constructor() {
        super();
        makeObservable(this);
        this.installGridModel();

        // All of the above are construction-time GridModel / chooser configs, so rebuild the model
        // (and the chooser bound to it) whenever any of them change.
        this.addReaction({
            track: () => [
                this.lockColumnGroups,
                this.enableColumnPinning,
                this.enableChooser,
                this.mode,
                this.width,
                this.height,
                this.commitOnChange,
                this.side,
                this.showRestoreDefaults,
                this.autosizeOnCommit,
                this.filterMatchMode,
                this.columnLibraryEnabled,
                this.collapseLibraryGroups,
                this.libraryWidth
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.installGridModel();
                this.loadAsync().catchDefault();
            }
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const sales = await XH.fetchJson({url: 'sales'}, {loadSpec});
        this.gridModel.loadData(sales);
    }

    private installGridModel() {
        this.gridModel = this.createGridModel();
        // Open a docked chooser so the demo lands showing it (no built-in rail to do so).
        if (this.mode === 'docked') this.gridModel.showColChooser();
    }

    private createGridModel(): GridModel {
        return new GridModel({
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: this.enableChooser
                ? {
                      mode: this.mode,
                      columnLibrary: this.columnLibraryEnabled && {
                          collapseGroups: this.collapseLibraryGroups,
                          libraryWidth: this.libraryWidth
                      },
                      showRestoreDefaults: this.showRestoreDefaults,
                      autosizeOnCommit: this.autosizeOnCommit,
                      filterMatchMode: this.filterMatchMode,
                      commitOnChange: this.commitOnChange,
                      // Bucket width; the chooser grows by `libraryWidth` while the library is shown.
                      width: this.width,
                      height: this.height,
                      panelConfig: {side: this.side}
                  }
                : false,
            enableExport: true,
            lockColumnGroups: this.lockColumnGroups,
            enableColumnPinning: this.enableColumnPinning,
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
