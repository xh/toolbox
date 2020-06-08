import {hoistCmp, HoistModel, LoadSupport, managed, useLocalModel, XH} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {boolCheckCol,  GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';

export const gridWidget = hoistCmp.factory({
    render({viewModel}) {
        const model = useLocalModel(() => new LocalModel(viewModel));
        return grid({model: model.gridModel});
    }
});

@HoistModel
@LoadSupport
class LocalModel {

    viewModel;
    @managed gridModel;

    constructor(viewModel) {
        this.viewModel = viewModel;

        this.gridModel = new GridModel({
            sortBy: 'profit_loss|desc|abs',
            enableColChooser: true,
            sizingMode: XH.appModel.gridSizingMode,
            store: {
                fields: [{name: 'trade_date', type: 'localDate'}]
            },
            persistWith: {dashViewModel: viewModel},
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    hidden: true
                },
                {
                    field: 'company',
                    flex: 2,
                    minWidth: 200,
                    maxWidth: 350,
                    exportName: 'Company'
                },
                {
                    field: 'winLose',
                    hidden: true,
                    excludeFromChooser: true
                },
                {
                    field: 'city',
                    minWidth: 150,
                    maxWidth: 200
                },
                {
                    headerName: 'Volume',
                    field: 'trade_volume',
                    align: 'right',
                    width: 110,
                    tooltip: (val) => fmtNumberTooltip(val),
                    renderer: millionsRenderer({
                        precision: 1,
                        label: true
                    })
                },
                {
                    headerName: 'P&L',
                    field: 'profit_loss',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    })
                },
                {
                    headerName: 'Date',
                    field: 'trade_date',
                    ...localDateCol
                },
                {
                    field: 'active',
                    ...boolCheckCol,
                    headerName: '',
                    chooserName: 'Active Status'
                }
            ]
        });

    }

    async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});

        this.gridModel.loadData(trades);
    }
}