import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, span, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {OLHCChartModel} from './OLHCChartModel';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class OLHCChartPanel extends Component {
    model = new OLHCChartModel();

    render() {
        const {model} = this,
            {symbols, chartModel} = model;

        return wrapper({
            style: {paddingTop: 0},
            item: panel({
                className: 'toolbox-olhcchart-panel',
                title: 'Charts › OHLC',
                icon: Icon.chartLine(),
                width: 800,
                height: 600,
                item: this.renderExample(),
                tbar: toolbar(
                    span('Symbol: '),
                    select({
                        model,
                        bind: 'currentSymbol',
                        options: symbols,
                        enableFilter: false,
                        width: 120
                    }),
                    toolbarSep(),
                    span('Aspect Ratio: '),
                    numberInput({
                        width: 50,
                        model,
                        bind: 'aspectRatio',
                        commitOnChange: true,
                        selectOnFocus: true,
                        min: 0
                    }),
                    filler(),
                    button({
                        text: 'Call chart API',
                        icon: Icon.code(),
                        disabled: !chartModel.highchartsChart,
                        onClick: () => {
                            const xExtremes = chartModel.highchartsChart.axes[0].getExtremes()
                            XH.alert({
                                title: 'X-axis extremes - as read from chart API',
                                message: JSON.stringify(xExtremes)
                            });
                        }
                    })
                )
            })
        });
    }

    renderExample() {
        const {chartModel, aspectRatio} = this.model;
        return vframe({
            className: 'toolbox-example-container',
            item: chart({
                model: chartModel, 
                aspectRatio: aspectRatio
            })
        });
    }
}