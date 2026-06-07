import {creates, hoistCmp, HoistModel, lookup, managed} from '@xh/hoist/core';
import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {modalToggleButton} from '@xh/hoist/desktop/cmp/button';
import {fmtPrice} from '@xh/hoist/format';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';

// Mocked live-monitor parameters - tuned to keep the random walk in a believable band.
const TICK_INTERVAL = 1 * SECONDS,
    START_PRICE = 142.0,
    BAND_CENTER = 142.0,
    MAX_STEP = 0.35, // Largest move (USD) on any single tick.
    REVERSION = 0.05, // Pull back toward center, keeping the walk from wandering off.
    HISTORY_LENGTH = 90; // Rolling window of points retained on the chart.

export const chartWidget = hoistCmp.factory({
    model: creates(() => ChartWidgetModel),
    render({model}) {
        const {panelModel, dashViewModel} = model,
            modalOpts = {
                title: dashViewModel.fullTitle,
                icon: dashViewModel.icon,
                headerItems: [modalToggleButton({panelModel})]
            };

        return panel({
            model: panelModel,
            ...(panelModel.isModal ? modalOpts : {}),
            item: chart({model: model.chartModel})
        });
    }
});

/**
 * Self-contained mock of a real-time price monitor.
 *
 * Generates a natural, mean-reverting random walk on a Timer, pushing each new tick onto a
 * Highcharts spline series and floating the latest price up to the hosting view's title via
 * `DashViewModel.titleDetails`.
 */
class ChartWidgetModel extends HoistModel {
    @lookup(DashViewModel) dashViewModel: DashViewModel;

    @observable.ref data: [number, number][] = [];
    @bindable price = START_PRICE;

    @managed chartModel = new ChartModel({
        highchartsConfig: {
            chart: {type: 'spline', animation: false},
            title: {text: null},
            legend: {enabled: false},
            exporting: {enabled: false},
            tooltip: {valuePrefix: '$', valueDecimals: 2},
            xAxis: {type: 'datetime'},
            yAxis: {title: {text: 'USD'}},
            plotOptions: {
                spline: {
                    marker: {enabled: false},
                    lineWidth: 2
                }
            }
        }
    });

    @managed panelModel = new PanelModel({
        modalSupport: true,
        showModalToggleButton: false,
        collapsible: false,
        resizable: false
    });

    @managed
    timer = Timer.create({
        runFn: () => this.addTick(),
        interval: TICK_INTERVAL,
        delay: true
    });

    constructor() {
        super();
        makeObservable(this);

        // Seed the chart with a short history so it reads as a live monitor on first render.
        this.seedHistory();

        this.addReaction({
            track: () => this.data,
            run: () => this.chartModel.setSeries({name: 'Price', data: this.data})
        });

        this.addReaction({
            track: () => this.price,
            run: price => {
                if (this.dashViewModel) {
                    // Lead with a middot so the live price reads as a distinct segment after the
                    // title (fullTitle joins title + titleDetails with a space): "Live Chart - $142".
                    const formatted = fmtPrice(price, {
                        precision: 2,
                        prefix: '$',
                        asHtml: true
                    });
                    this.dashViewModel.titleDetails = `· ${formatted}`;
                }
            }
        });
    }

    override onLinked() {
        this.dashViewModel.extraMenuItems = [
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
    }

    /** Build an initial back-fill of points ending at "now" so the chart starts populated. */
    private seedHistory() {
        const now = Date.now(),
            data: [number, number][] = [];

        let price = START_PRICE;
        for (let i = HISTORY_LENGTH; i > 0; i--) {
            price = this.nextPrice(price);
            data.push([now - i * TICK_INTERVAL, round(price)]);
        }

        runInAction(() => {
            this.data = data;
            this.price = data[data.length - 1][1];
        });
    }

    /** Advance the walk by one tick, append a new point, and drop the oldest. */
    private addTick() {
        const price = this.nextPrice(this.price),
            point: [number, number] = [Date.now(), round(price)];

        runInAction(() => {
            this.data = [...this.data.slice(-(HISTORY_LENGTH - 1)), point];
            this.price = point[1];
        });
    }

    /**
     * Compute the next price via a mean-reverting random walk: a small random step combined with
     * a gentle pull back toward the band center. This keeps movement natural - never spiky or
     * unbounded - while still drifting believably.
     */
    private nextPrice(price: number): number {
        const step = (Math.random() - 0.5) * 2 * MAX_STEP,
            reversion = (BAND_CENTER - price) * REVERSION;
        return price + step + reversion;
    }
}

function round(v: number): number {
    return Math.round(v * 100) / 100;
}
