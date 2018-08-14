/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';

@HoistComponent()
export class PanelContainerPanel extends Component {

    leftSizingModel = new PanelSizingModel({
        defaultSize: 125,
        side: 'left'
    });

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 100,
        side: 'bottom'
    });

    render() {
        return wrapper({
            description: `
                Panels provides support for a number of important and frequent layout tasks.  They include a header bar
                with a standard icon, title, and header items.  They also provide support for toolbars.  Finally they
                can support collapsing and drag-and-drop resizing, and include support for automatically saving this
                state in a preference.
            `,
            item: panel({
                title: 'Containers > Panel',
                icon: Icon.arrowToRight(),
                height: 400,
                width: 700,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                sizingModel: this.leftSizingModel,
                                item: box({
                                    padding: 10,
                                    item: 'Collapsible Left'
                                })
                            }),
                            box({
                                padding: 10,
                                item: 'Main Content Area'
                            })
                        ]
                    }),
                    panel({
                        sizingModel: this.bottomSizingModel,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
                        })
                    })
                ]
            })
        });
    }
}