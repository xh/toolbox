import {switchInput, numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {code, em, filler, frame, hframe, p, span, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {dashCanvasWidgetChooser} from '@xh/hoist/desktop/cmp/dash/canvas/widgetchooser/DashCanvasWidgetChooser';

import {wrapper} from '../../../common';
import {DashCanvasPanelModel} from './DashCanvasPanelModel';

import './DashCanvasPanel.scss';

export const dashCanvasPanel = hoistCmp.factory({
    model: creates(() => DashCanvasPanelModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    code('DashCanvas'),
                    ' is configured via a ',
                    code('DashCanvasModel'),
                    ' and renders user-arrangeable widgets in a drag-and-drop grid layout.'
                ),
                p(
                    'Unlike ',
                    code('DashContainer'),
                    ', this component scales only the ',
                    em('width'),
                    ' of its widgets as overall size changes, keeping heights fixed and scrolling as needed. This makes it well-suited for report-style dashboards with content that won\'t compress well on smaller screens. Use ',
                    code('DashContainer'),
                    ' when a space-filling layout is preferred.'
                ),
                p(
                    'This example also demonstrates ',
                    code('DashCanvasWidgetChooser'),
                    ', a ready-made sidebar for browsing and dragging available widgets onto the canvas.'
                )
            ],
            item: panel({
                title: 'Layout › DashCanvas',
                icon: Icon.layout(),
                headerItems: [refreshButton({minimal: true, intent: null})],
                className: 'dash-canvas-droppable-demo',
                height: '80%',
                width: '80%',
                tbar: tbar(),
                item: hframe(
                    model.renderDashboard
                        ? dashCanvas({
                              omit: !model.dashCanvasModel // model is not created until async load of symbols completes
                          })
                        : frame({
                              item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                              padding: 10
                          }),
                    vframe({
                        omit: !model.showWidgetChooser || !model.renderDashboard,
                        width: 310,
                        style: {borderLeft: '1px solid var(--xh-border-color)'},
                        item: dashCanvasWidgetChooser({
                            dashCanvasModel: model.dashCanvasModel
                        })
                    })
                ),
                bbar: bbar()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/dashCanvas/DashCanvasPanel.ts',
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

const commitOnChange = true;
const tbar = hoistCmp.factory<DashCanvasPanelModel>(({model}) =>
    toolbar(
        span('Columns'),
        numberInput({
            width: 40,
            bind: 'columns',
            commitOnChange,
            model: model.dashCanvasModel
        }),
        '-',
        span('Row Height'),
        numberInput({
            width: 60,
            bind: 'rowHeight',
            valueLabel: 'px',
            commitOnChange,
            model: model.dashCanvasModel
        }),
        '-',
        span('Compact'),
        select({
            width: 120,
            bind: 'compact',
            model: model.dashCanvasModel,
            options: ['vertical', 'horizontal', false]
        }),
        '-',
        switchInput({
            label: 'Show Background',
            bind: 'showGridBackground',
            labelSide: 'left',
            model: model.dashCanvasModel
        }),
        filler(),
        button({
            text: 'Widget Chooser',
            icon: Icon.boxFull(),
            outlined: !model.showWidgetChooser,
            active: model.showWidgetChooser,
            onClick: () => (model.showWidgetChooser = !model.showWidgetChooser)
        })
    )
);

const bbar = hoistCmp.factory<DashCanvasPanelModel>(({model}) =>
    toolbar(
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
    )
);
