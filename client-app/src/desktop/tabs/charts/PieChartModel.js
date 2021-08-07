import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import Highcharts from 'highcharts/highstock';
import {capitalize, cloneDeep, isEmpty, sortBy} from 'lodash';

// import {ContextMenuItem} from '@xh/hoist/desktop/cmp/contextmenu';
// import {Icon} from '@xh/hoist/icon';


export class PieChartModel extends HoistModel {

    // todo: 
    // get colors to reset based on slices at drilldown level
    // get subtitle to reflect drilldown path

    @managed
    groupingChooserModel = new GroupingChooserModel({
        dimensions: ['region', 'sector', {name: 'symbol', isLeafDimension: true}],
        initialValue: ['sector', 'symbol'],
        initialFavorites: [
            ['sector', 'symbol'],
            ['region', 'sector', 'symbol'],
            ['region', 'symbol'],
            ['sector'],
            ['symbol']
        ],
        persistWith: {
            localStorageKey: 'gridPieDims',
            persistFavorites: true
        }
    });

    get chartTitle() {
        return 'Profit by ' + this.groupingChooserModel.value.map(capitalize).join(' > ');
    }

    _colorCount = 0;

    @managed
    chartModel = new ChartModel({
        highchartsConfig: this.getChartModelCfg()
        // cases:
        // contextMenu: undefined                   // => show default   // confirmed
        // contextMenu: null                        // => show none      // confirmed
        // contextMenu: false                       // => show none      // confirmed
        // contextMenu: true                        // => show default   // confirmed
        // contextMenu: ['viewFullscreen'],         // => show custom   // confirmed
        // contextMenu: [                           // => show custom   // confirmed
        //     {
        //         text: 'View in full screen',
        //         icon: Icon.expand(),
        //         actionFn: (chartModel) => chartModel.highchart.fullscreen.toggle()
        //     },
        //     new ContextMenuItem({
        //         text: 'Download PNG image',
        //         icon: Icon.fileImage(),
        //         actionFn: (chartModel) => chartModel.highchart.exportChart()
        //     }),
        //     '-',
        //     'downloadCSV'
        // ],
        // contextMenu: (chartModel) => [                         // => show custom   // confirmed
        //     {
        //         text: 'View in full screen',
        //         icon: Icon.expand(),
        //         actionFn: (chartModel) => chartModel.highchart.fullscreen.toggle()
        //     },
        //     new ContextMenuItem({
        //         text: 'Download PNG image',
        //         icon: Icon.fileImage(),
        //         actionFn: (chartModel) => chartModel.highchart.exportChart()
        //     }),
        //     '-',
        //     'downloadCSV'
        // ]
    });

    constructor() {
        super();
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const data = await XH.portfolioService.getPositionsAsync(this.groupingChooserModel.value),
            sortedData = this.sort(data),    
            series = this.getSeries(sortedData),
            drilldown = this.getDrilldown(sortedData),
            colors = this.getPieColors();

        this.chartModel.setSeries(series);
        this.updateHighchartsConfig(drilldown, colors, this.chartTitle);
    }

    getSeries(data) {
        const dims = this.groupingChooserModel.value,
            hasDrilldown = dims.length > 1;

        return [{
            name: dims[0],
            colorByPoint: true,
            data: data.map(it => ({
                name: it.name,
                y: it.pnl,
                drilldown: hasDrilldown ? it.name : undefined
            }))
        }];
    }

    getDrilldown(data) {
        const dims = this.groupingChooserModel.value;
        this._colorCount = data.length;

        if (dims.length === 1) return;

        const series = [];

        const buildDrilldownSeries = (name, children) => {  
            this._colorCount = Math.max(this._colorCount, children.length);
            children = this.sort(children);

            series.push({
                name: name,
                id: name,
                data: children.map(it => {
                    const hasDrilldown = !isEmpty(it.children);
                    if (hasDrilldown) {
                        buildDrilldownSeries(name + '_' + it.name, it.children);
                    }

                    return {
                        name: it.name,
                        y: it.pnl,
                        drilldown: hasDrilldown ? name + '_' + it.name : undefined
                    };
                })
            });
        };

        data.forEach((it) => {
            if (isEmpty(it.children)) return;
            buildDrilldownSeries(it.name, it.children);
        });

        return {series};
    }

    sort(data) {
        return sortBy(data, ['pnl']).reverse();
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'pie'
            },
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: [
                            'viewFullscreen',
                            'separator', 
                            'printChart',
                            'downloadPNG', 
                            'downloadSVG', 
                            'separator', 
                            'downloadCSV'
                        ]
                    }
                }
            },
            title: {text: null},
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            }
        };
    }

    // special handling around updates needed
    // because drillown and colors must overwrite, not merge.
    updateHighchartsConfig(drilldown, colors, title) {
        const conf = cloneDeep(this.chartModel.highchartsConfig);
        conf.title.text = title;
        if (drilldown) {
            conf.drilldown = drilldown;
        } else {
            delete conf.drilldown;
        }
        conf.plotOptions.pie.colors = colors;
        this.chartModel.setHighchartsConfig(conf);
    }

    getPieColors() {
        const colors = [],
            greenBase = Highcharts.getOptions().colors[2];

        for (let i = 0; i < this._colorCount; i++) {
            
            // Start out with a darkened base color (negative brighten), and end
            // up with a much brighter color
            colors.push(Highcharts.color(greenBase).brighten((i - 3) / this._colorCount).get());
        }

        return colors.map(this.applyGradient);
    }

    applyGradient(color) {
        return {
            radialGradient: {
                cx: 0.5,
                cy: 0.3,
                r: 0.7
            },
            stops: [
                [0, color],
                [1, Highcharts.color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    }
}
