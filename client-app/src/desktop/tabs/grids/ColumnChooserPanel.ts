import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe, p} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {columnChooser} from '@xh/hoist/desktop/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {makeObservable} from '@xh/hoist/mobx';
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
    @managed gridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = new GridModel({
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            columns: [
                {
                    groupId: 'demographics',
                    children: [
                        {...fullNameCol},
                        {...firstNameCol, hidden: true},
                        {...lastNameCol, hidden: true},
                        {...cityCol, hidden: true},
                        {...stateCol}
                    ]
                },
                {...salaryCol},
                {
                    groupId: 'sales',
                    headerName: 'Sales',
                    headerAlign: 'center',
                    children: [
                        {
                            groupId: 'projected',
                            borders: false,
                            headerAlign: 'center',
                            children: [{...projectedUnitsSoldCol}, {...projectedGrossCol}]
                        },
                        {
                            groupId: 'actual',
                            borders: false,
                            headerAlign: 'center',
                            children: [{...actualUnitsSoldCol}, {...actualGrossCol}]
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
}
