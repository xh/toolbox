import React from 'react';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {chart} from '@xh/hoist/cmp/chart';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';

import {wrapper, sampleGrid} from '../../common';
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
                item: dashContainer({model: model.dashContainerModel})
            })
        });
    }
});

@HoistModel
class Model {
    @managed
    dashContainerModel = new DashContainerModel({
        views: [
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                allowClose: false,
                content: () => sampleGrid({omitGridTools: true})
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                content: SimpleChartPanel
            },
            {
                id: 'panel',
                title: 'Panel',
                content: () => panel(
                    box({
                        item: 'Just a panel',
                        padding: 10
                    })
                )
            }
        ],
        layout: {
            type: 'row',
            content: [
                'grid',
                {
                    type: 'column',
                    content: [
                        'chart',
                        'panel'
                    ]
                }
            ]
        }
    });
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