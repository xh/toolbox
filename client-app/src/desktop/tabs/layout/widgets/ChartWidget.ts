import {creates, hoistCmp, lookup, managed} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {DashCanvasViewModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {button, modalToggleButton} from '@xh/hoist/desktop/cmp/button';
import {ONE_DAY} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';
import {LineChartModel} from '../../charts/LineChartModel';
import './ChartWidget.scss';

export const chartWidget = hoistCmp.factory({
    model: creates(() => ChartWidgetModel),
    render({model}) {
        const {panelModel, symbols, dashViewModel} = model,
            modalOpts = {
                title: dashViewModel.fullTitle,
                icon: dashViewModel.icon,
                headerItems: [rangeSelector({model}), modalToggleButton({panelModel})]
            };

        return panel({
            model: panelModel,
            ...(panelModel.isModal ? modalOpts : {}),
            item: chart(),
            bbar: !model.presetSymbol
                ? [
                      box('Symbol: '),
                      select({
                          bind: 'currentSymbols',
                          options: symbols,
                          enableFilter: false,
                          enableMulti: true
                      })
                  ]
                : null
        });
    }
});

const rangeSelector = hoistCmp.factory(() =>
    buttonGroupInput({
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
    @lookup(DashViewModel) dashViewModel: DashViewModel;
    @managed panelModel = new PanelModel({
        modalSupport: true,
        showModalToggleButton: false,
        collapsible: false,
        resizable: false
    });

    get presetSymbol() {
        return this.dashViewModel?.viewSpec.id.split('-')[1];
    }

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => [this.range, this.chartModel.series],
            run: () => {
                if (!this.chartModel.series[0] || !this.chartModel.highchart) return;
                const endDate = new Date(),
                    startDate = new Date(endDate.getTime() - ONE_DAY * this.range);

                this.chartModel.highchart.xAxis[0].setExtremes(
                    startDate.getTime(),
                    endDate.getTime()
                );
            }
        });
    }

    override onLinked() {
        const {dashViewModel, panelModel} = this;

        if (this.presetSymbol) {
            dashViewModel.title = this.presetSymbol;
            this.currentSymbols = [this.presetSymbol];
        }

        dashViewModel.extraMenuItems = [
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
        ];

        if (dashViewModel instanceof DashCanvasViewModel) {
            dashViewModel.headerItems = [
                rangeSelector({model: this}),
                modalToggleButton({panelModel})
            ];

            this.chartModel.updateHighchartsConfig({
                rangeSelector: {enabled: false},
                exporting: {enabled: false}
            });
        }

        // Demo dynamic titleDetails with ticking timestamp in view title.
        setInterval(() => {
            dashViewModel.titleDetails = new Date().toTimeString().split(' ')[0];
        }, 1000);
    }
}
