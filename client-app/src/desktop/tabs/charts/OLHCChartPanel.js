import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {box, filler, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select, numberInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {OLHCChartModel} from './OLHCChartModel';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {Icon} from '@xh/hoist/icon/index';
import { controlGroup } from '@xh/hoist/kit/blueprint';

@HoistComponent
export class OLHCChartPanel extends Component {
    model = new OLHCChartModel();

    render() {
        const model = this.model,
            {companyMap} = model;
        return wrapper({
            style: {paddingTop: 0},
            item: panel({
                className: 'toolbox-olhcchart-panel',
                title: 'OLHC Chart',
                width: model.width,
                height: model.height,
                item: this.renderExample(),
                tbar: toolbar(
                    box('Company: '),
                    select({
                        model,
                        bind: 'currentCompany',
                        options: Object.keys(companyMap),
                        enableFilter: false
                    }),
                    filler(),
                    box('Aspect Ratio: '),
                    controlGroup({
                        items: [
                            numberInput({
                                width: 50,
                                model,
                                bind: 'aspectRatio',
                                commitOnChange: true,
                                min: 0
                            }),
                            button({
                                icon: Icon.cross(),
                                minimal: false,
                                onClick: () => {
                                    model.setAspectRatio(null);
                                }
                            })
                        ]
                    }),
                    button({
                        icon: Icon[model.maximizeBtnIcon](),
                        intent: 'primary',
                        onClick: () => this.toggleMaximized()
                    }),
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

    toggleMaximized() {
        const {model} = this,
            {offsetWidth, offsetHeight} = this.getDOMNode();

        model.setWidth(model.width == model.initWidth ? offsetWidth: model.initWidth);
        model.setHeight(model.height == model.initHeight ? offsetHeight: model.initHeight);
        model.setMaxMinBtn(model.maximizeBtnIcon == 'expand' ? 'collapse' : 'expand');
    }
}