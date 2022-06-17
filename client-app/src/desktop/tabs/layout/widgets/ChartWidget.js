import {creates, hoistCmp, lookup, managed} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {DashCanvasViewModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {button} from '@xh/hoist/desktop/cmp/button';
import {ONE_DAY} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';
import './ChartWidget.scss';
import {LineChartModel} from '../../charts/LineChartModel';
import {modalButton} from '@xh/hoist/desktop/cmp/panel/impl/PanelHeader';

export const chartWidget = hoistCmp.factory({
    model: creates(() => ChartWidgetModel),
    render({model}) {
        return panel({
            model: model.panelModel,
            item: chart(),
            bbar: [
                box('Symbol: '),
                select({
                    bind: 'currentSymbol',
                    options: model.symbols,
                    enableFilter: false
                })
            ]
        });
    }
});

const rangeSelector = hoistCmp.factory(
    () => buttonGroupInput({
        bind: 'range',
        items: [
            button({text: '7D', value: 7}),
            button({text: '30D', value: 30}),
            button({text: '60D', value: 60}),
            button({text: '90D', value: 90})
        ],
        className: 'tb-chart-widget__buttons'
    })
);

class ChartWidgetModel extends LineChartModel {

    @bindable range = 30;
    @lookup(DashViewModel) dashViewModel;
    @managed panelModel = new PanelModel({modalView: true, collapsible: false, resizable: false});

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => [this.range, this.chartModel.series],
            run: () => {
                if (!this.chartModel.series[0]) return;
                const endDate = new Date(),
                    startDate = new Date(endDate.getTime() - ONE_DAY * this.range);
                this.chartModel.highchart.xAxis[0].setExtremes(startDate.getTime(), endDate.getTime());
            }
        });
    }

    onLinked() {
        const {dashViewModel, panelModel} = this;

        dashViewModel.setExtraMenuItems([
            {
                text: 'Print chart',
                icon: Icon.print(),
                actionFn: () => this.chartModel.highchart.print()
            },
            {
                text: 'Export Data',
                icon: Icon.fileCsv(),
                actionFn: () => this.chartModel.highchart.downloadCSV()
            }
        ]);

        if (dashViewModel instanceof DashCanvasViewModel) {
            dashViewModel.setHeaderItems([
                rangeSelector({model: this}),
                modalButton({panelModel})
            ]);

            this.chartModel.updateHighchartsConfig({
                rangeSelector: {enabled: false},
                exporting: {enabled: false}
            });
        }
    }
}