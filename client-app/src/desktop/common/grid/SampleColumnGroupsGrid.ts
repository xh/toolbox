import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {StoreRecord} from '@xh/hoist/data';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {createRef} from 'react';
import {isEmpty} from 'lodash';
import {gridOptionsPanel} from './options/GridOptionsPanel';
import {
    actualGrossCol,
    actualUnitsSoldCol,
    cityCol,
    firstNameCol,
    fullNameCol,
    lastNameCol,
    projectedGrossCol,
    projectedUnitsSoldCol,
    retainCol,
    salaryCol,
    stateCol
} from '../../../core/columns';

export const sampleColumnGroupsGrid = hoistCmp.factory({
    model: creates(() => SampleColumnGroupsGridModel),

    render({model, ...props}) {
        const {gridModel} = model;

        return panel({
            item: hframe(grid(), gridOptionsPanel({model: gridModel})),
            ref: model.panelRef,
            mask: 'onLoad',
            tbar: [
                refreshButton(),
                toolbarSep(),
                switchInput({
                    bind: 'groupRows',
                    label: 'Group rows:',
                    labelSide: 'left'
                }),
                toolbarSep(),
                switchInput({
                    bind: 'inMillions',
                    label: 'Gross in millions:',
                    labelSide: 'left'
                }),
                filler(),
                gridCountLabel(),
                storeFilterField(),
                colChooserButton(),
                exportButton()
            ],
            ...props
        });
    }
});

class SampleColumnGroupsGridModel extends HoistModel {
    @managed gridModel: GridModel;
    @bindable inMillions: boolean = false;

    panelRef = createRef<HTMLElement>();

    get groupRows() {
        return !isEmpty(this.gridModel?.groupBy);
    }

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.inMillions,
            run: () => {
                this.gridModel.agApi.refreshCells({
                    columns: ['projectedGross', 'actualGross'],
                    force: true
                });
            }
        });
    }

    //------------------------
    // Implementation
    //------------------------
    private createGridModel() {
        const millionsAwareCol = {
            headerName: () => 'Gross' + (this.inMillions ? ' (m)' : ''),
            rendererIsComplex: true,
            renderer: v => {
                return this.inMillions
                    ? fmtMillions(v, {label: true, precision: 2})
                    : fmtNumber(v, {precision: 0});
            }
        };

        return new GridModel({
            persistWith: {localStorageKey: 'toolboxGroupGrid'},
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            groupBy: 'state',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            contextMenu: () => {
                return [
                    {
                        text: 'View Details',
                        icon: Icon.search(),
                        recordsRequired: 1,
                        actionFn: ({record}) => this.showRecToast(record)
                    },
                    '-',
                    ...GridModel.defaultContextMenu
                ];
            },
            columns: [
                {
                    groupId: 'demographics',
                    children: [
                        {
                            ...fullNameCol,
                            agOptions: {
                                columnGroupShow: 'closed'
                            }
                        },
                        {
                            ...firstNameCol,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            ...lastNameCol,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            ...cityCol,
                            hidden: true,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            ...stateCol,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        }
                    ]
                },
                {...salaryCol},
                {
                    groupId: 'sales',
                    headerName: () => 'Sales' + (this.inMillions ? ' (in millions)' : ''),
                    headerAlign: 'center',
                    children: [
                        {
                            groupId: 'projected',
                            headerAlign: 'center',
                            headerClass: 'xh-blue',
                            children: [
                                {...projectedUnitsSoldCol},
                                {...projectedGrossCol, ...millionsAwareCol}
                            ]
                        },
                        {
                            groupId: 'actual',
                            headerAlign: 'center',
                            headerClass: 'xh-red',
                            children: [
                                {...actualUnitsSoldCol},
                                {...actualGrossCol, ...millionsAwareCol}
                            ]
                        }
                    ]
                },
                {...retainCol}
            ]
        });
    }

    override async doLoadAsync(loadSpec) {
        const sales = await XH.fetchJson({url: 'sales'});
        this.gridModel.loadData(sales);
    }

    private showRecToast(rec: StoreRecord) {
        const {firstName, actualUnitsSold} = rec.data;
        XH.toast({
            message: `You asked to see details for ${firstName}. They sold ${actualUnitsSold} last year.`,
            intent: 'primary',
            containerRef: this.panelRef.current
        });
    }
}
