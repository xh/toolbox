import React from 'react';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {layoutContainer, LayoutContainerModel} from '@xh/hoist/cmp/layoutcontainer';

import {wrapper, sampleGrid} from '../../common';

export const LayoutContainerPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: <p>
                Todo
            </p>,
            item: panel({
                title: 'Containers › Layout',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: layoutContainer({model: model.layoutContainerModel})
            })
        });
    }
});

@HoistModel
class Model {
    @managed
    layoutContainerModel = new LayoutContainerModel({
        panels: [
            {
                id: 'gridPanel',
                content: () => panel({
                    title: 'Grid',
                    icon: Icon.gridPanel(),
                    compactHeader: true,
                    item: sampleGrid({omitGridTools: true})
                })
            },
            {
                id: 'panel1',
                content: () => panel({
                    title: 'Panel 1',
                    compactHeader: true,
                    item: 'Just a panel'
                })
            },
            {
                id: 'panel2',
                content: () => panel({
                    title: 'Panel 2',
                    compactHeader: true,
                    item: 'Just another panel'
                })
            }
        ],
        layout: {
            type: 'row',
            content: [
                'gridPanel',
                {
                    type: 'column',
                    content: [
                        'panel1',
                        'panel2'
                    ]
                }
            ]
        }
    });
}