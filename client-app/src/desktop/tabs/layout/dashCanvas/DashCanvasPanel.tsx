import {switchInput, numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, frame, hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {dashCanvasWidgetWell} from '@xh/hoist/desktop/cmp/dash/canvas/widgetwell/DashCanvasWidgetWell';

import {wrapper} from '../../../common';
import {DashCanvasPanelModel} from './DashCanvasPanelModel';

import './DashCanvasPanel.scss';

export const dashCanvasPanel = hoistCmp.factory({
    model: creates(() => DashCanvasPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashCanvas</code> is configured and managed via a{' '}
                    <code>DashCanvasModel</code> and allows the user to drag-and-drop configured
                    widgets into highly-customizable layouts.
                </p>,
                <p>
                    Unlike its cousin <code>DashContainer</code>, this component scales the{' '}
                    <em>width only</em> of its child widgets as its overall size changes, leaving
                    heights unchanged and scrolling internally as necessary. This makes it a good
                    candidate for report-style dashboards containing lots of content that is
                    unlikely to fit or compress nicely on smaller screens. Consider{' '}
                    <code>DashContainer</code> instead when a space-filling layout is a priority.
                </p>
            ],
            item: panel({
                title: 'Layout › DashCanvas',
                icon: Icon.layout(),
                headerItems: [refreshButton({minimal: true, intent: null})],
                className: 'dash-canvas-droppable-demo',
                height: '80%',
                width: '80%',
                item: hframe(
                    model.renderDashboard
                        ? dashCanvas({
                              omit: !model.dashCanvasModel
                          })
                        : frame({
                              item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                              padding: 10
                          }),
                    panel({
                        omit: !model.renderDashboard,
                        icon: Icon.arrowsLeftRight(),
                        title: 'Add Widgets...',
                        width: 250,
                        modelConfig: {
                            side: 'right',
                            defaultSize: 250
                        },
                        item: dashCanvasWidgetWell({
                            dashCanvasModel: model.dashCanvasModel
                        })
                    })
                ),
                bbar: bbar()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/dashCanvas/DashCanvasPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvas.ts',
                    notes: 'Hoist container component.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasModel.ts',
                    notes: 'Hoist container model - primary API.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewSpec.ts',
                    notes: 'Configuration template for contained views.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewModel.ts',
                    notes: 'Model for contained view instances. '
                }
            ]
        });
    }
});

const bbar = hoistCmp.factory<DashCanvasPanelModel>(({model}) =>
    toolbar({
        enableOverflowMenu: true,
        children: [
            switchInput({
                label: 'Render Dashboard',
                bind: 'renderDashboard',
                labelSide: 'left'
            }),
            '-',
            switchInput({
                label: 'Layout Locked',
                bind: 'layoutLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                label: 'Content Locked',
                bind: 'contentLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                label: 'Rename Locked',
                bind: 'renameLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                label: 'Show Background',
                bind: 'showGridBackground',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            'Columns',
            numberInput({
                width: 80,
                bind: 'columns',
                model: model.dashCanvasModel
            }),
            '-',
            'Row Ht.',
            numberInput({
                width: 80,
                bind: 'rowHeight',
                model: model.dashCanvasModel
            }),
            '-',
            'Compact Views',
            select({
                bind: 'compact',
                model: model.dashCanvasModel,
                options: ['vertical', 'horizontal', false]
            }),
            filler(),
            button({
                text: 'Clear',
                icon: Icon.cross(),
                onClick: () => model.clearCanvas()
            }),
            button({
                text: 'Reset State',
                icon: Icon.reset(),
                onClick: () => model.resetState()
            })
        ]
    })
);
