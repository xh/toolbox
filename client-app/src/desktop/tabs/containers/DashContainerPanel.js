import React from 'react';
import {XH, creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {box, filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {chart} from '@xh/hoist/cmp/chart';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {DashRenderMode, DashRefreshMode} from '@xh/hoist/enums';

import {wrapper, sampleGrid, sampleTreeGrid} from '../../common';
import {LineChartModel} from '../charts/LineChartModel';
import {select} from '@xh/hoist/desktop/cmp/input';

export const DashContainerPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: <p>
                Todo
            </p>,
            item: panel({
                title: 'Containers › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: dashContainer({model: model.dashContainerModel}),
                bbar: [
                    button({
                        text: 'Reset State',
                        onClick: () => model.resetState()
                    }),
                    filler(),
                    button({
                        text: 'Capture State',
                        icon: Icon.save(),
                        onClick: () => model.saveState()
                    }),
                    button({
                        disabled: !model.state,
                        text: 'Load Saved State',
                        icon: Icon.upload(),
                        onClick: () => model.loadState()
                    })
                ]
            })
        });
    }
});

@HoistModel
class Model {
    @managed
    dashContainerModel = new DashContainerModel({
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                allowClose: false,
                content: () => sampleGrid({omitGridTools: true})
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                icon: Icon.grid(),
                content: () => sampleTreeGrid({model: {includeCheckboxes: false}})
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: DashRefreshMode.ON_SHOW_ALWAYS,
                content: SimpleChartPanel
            },
            {
                id: 'panel',
                title: 'Panel',
                renderMode: DashRenderMode.ALWAYS,
                content: () => panel(
                    box({
                        item: 'Just a panel',
                        padding: 10
                    })
                )
            }
        ],
        defaultState: [{
            type: 'row',
            content: [
                {
                    type: 'stack',
                    content: [
                        {type: 'view', id: 'grid'},
                        {type: 'view', id: 'treeGrid'}
                    ]
                },
                {
                    type: 'column',
                    content: [
                        {type: 'view', id: 'chart'},
                        {type: 'view', id: 'panel'}
                    ]
                }
            ]
        }]
    });

    @bindable.ref state;

    saveState() {
        this.setState(this.dashContainerModel.state);
        XH.toast({message: 'Dash state captured!'});
    }

    loadState() {
        this.dashContainerModel.loadStateAsync(this.state).then(() => {
            XH.toast({message: 'Dash state loaded!'});
        });
    }

    resetState() {
        this.dashContainerModel.resetStateAsync().then(() => {
            XH.toast({message: 'Dash state reset to default'});
        });
    }
}

// Minimal chart component, reusing an existing ChartModel
const SimpleChartPanel = hoistCmp({
    model: creates(LineChartModel),
    render({model}) {
        return panel({
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