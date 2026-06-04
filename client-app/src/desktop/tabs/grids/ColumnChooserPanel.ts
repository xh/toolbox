import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe, p, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {columnChooser} from '@xh/hoist/desktop/cmp/grid';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wrapper} from '../../common';
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

export const columnChooserPanel = hoistCmp.factory({
    model: creates(() => ColumnChooserPanelModel),
    render({model}) {
        return wrapper({
            description: [
                p(
                    'The new ColumnChooser component provides a modern interface for managing grid column visibility, ordering, and pinning with drag-and-drop support and column group hierarchy.'
                )
            ],
            item: panel({
                title: 'Grids › Column Chooser',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                item: hframe(
                    panel({
                        flex: 1,
                        item: grid({model: model.gridModel}),
                        tbar: [
                            span('Lock Column Groups'),
                            switchInput({
                                model,
                                bind: 'lockColumnGroups'
                            }),
                            filler(),
                            storeFilterField({gridModel: model.gridModel}),
                            colChooserButton({gridModel: model.gridModel}),
                            exportButton({gridModel: model.gridModel})
                        ]
                    }),
                    columnChooser({
                        gridModel: model.gridModel,
                        width: 350,
                        minWidth: 350
                    })
                )
            })
        });
    }
});

class ColumnChooserPanelModel extends HoistModel {
    @managed @observable.ref gridModel: GridModel;
    @bindable lockColumnGroups: boolean = true;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel(this.lockColumnGroups);

        this.addReaction({
            track: () => this.lockColumnGroups,
            run: lockColumnGroups => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel(lockColumnGroups);
                this.loadAsync().catchDefault();
            }
        });
    }

    override async doLoadAsync(loadSpec) {
        const sales = await XH.fetchJson({url: 'sales'});
        this.gridModel.loadData(sales);
    }

    private createGridModel(lockColumnGroups: boolean): GridModel {
        return new GridModel({
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            lockColumnGroups,
            columns: [
                {
                    groupId: 'demographics',
                    children: [
                        {
                            ...fullNameCol,
                            chooserDescription:
                                'Concatenation of first and last name, rendered as a single cell.'
                        },
                        {
                            ...firstNameCol,
                            hidden: true,
                            chooserDescription: 'Given name of the sales representative.'
                        },
                        {
                            ...lastNameCol,
                            hidden: true,
                            chooserDescription: 'Family name of the sales representative.'
                        },
                        {
                            ...cityCol,
                            hidden: true,
                            chooserDescription: 'City where the sales rep is based.'
                        },
                        {
                            ...stateCol,
                            chooserDescription:
                                'Two-letter US state code where the sales rep is based.'
                        }
                    ]
                },
                {
                    ...salaryCol,
                    chooserDescription: 'Base annual salary in USD, excluding bonuses.'
                },
                {
                    groupId: 'sales',
                    headerName: 'Sales',
                    headerAlign: 'center',
                    children: [
                        {
                            groupId: 'projected',
                            borders: false,
                            headerAlign: 'center',
                            children: [
                                {
                                    ...projectedUnitsSoldCol,
                                    chooserDescription:
                                        'Forecasted unit count for the current period, set at the start of the year.'
                                },
                                {
                                    ...projectedGrossCol,
                                    chooserDescription:
                                        'Forecasted gross revenue (USD) based on projected units and list price.'
                                }
                            ]
                        },
                        {
                            groupId: 'actual',
                            borders: false,
                            headerAlign: 'center',
                            children: [
                                {
                                    ...actualUnitsSoldCol,
                                    chooserDescription:
                                        'Actual unit count sold to date for the current period.'
                                },
                                {
                                    ...actualGrossCol,
                                    chooserDescription:
                                        'Actual gross revenue (USD) recognized to date for the current period.'
                                }
                            ]
                        }
                    ]
                },
                {
                    ...retainCol,
                    chooserDescription:
                        'Whether the sales rep should be retained for the next fiscal year.'
                }
            ]
        });
    }
}
