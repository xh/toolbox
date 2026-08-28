import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, HoistModel, managed, uses, XH} from '@xh/hoist/core';
import {StoreRecord} from '@xh/hoist/data';
import {colAutosizeButton, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {createRef} from 'react';
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

export class SampleColumnGroupsGridModel extends HoistModel {
    @managed gridModel: GridModel;
    @bindable accessor inMillions: boolean = false;

    panelRef = createRef<HTMLElement>();

    constructor() {
        super();
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
            persistWith: {localStorageKey: 'toolboxGroupGrid', persistGrouping: false},
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
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
                    ...GridModel.defaults.contextMenu
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
                            borders: false,
                            headerAlign: 'center',
                            headerClass: 'xh-blue',
                            children: [
                                {...projectedUnitsSoldCol},
                                {...projectedGrossCol, ...millionsAwareCol}
                            ]
                        },
                        {
                            groupId: 'actual',
                            borders: false,
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

export const sampleColumnGroupsGrid = hoistCmp.factory({
    model: uses(SampleColumnGroupsGridModel),

    render({model, ...props}) {
        return panel({
            item: grid(),
            ref: model.panelRef,
            mask: 'onLoad',
            tbar: [
                filler(),
                gridCountLabel(),
                '-',
                storeFilterField(),
                '-',
                colAutosizeButton(),
                colChooserButton(),
                exportButton()
            ],
            ...props
        });
    }
});
