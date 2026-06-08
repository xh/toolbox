import {box, frame, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {dashCanvasWidgetChooser} from '@xh/hoist/desktop/cmp/dash/canvas/widgetchooser/DashCanvasWidgetChooser';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper, wrapperAction, wrapperOption} from '../../../common';
import {DashCanvasPanelModel} from './DashCanvasPanelModel';
import './DashCanvasPanel.scss';

export const dashCanvasPanel = hoistCmp.factory({
    model: creates(() => DashCanvasPanelModel),

    render({model}) {
        const {dashCanvasModel} = model;
        return wrapper({
            title: 'DashCanvas',
            icon: Icon.layout(),
            description: [
                '`DashCanvas` is configured via a `DashCanvasModel` and renders',
                'user-arrangeable widgets in a drag-and-drop grid layout.',
                '',
                'Unlike `DashContainer`, this component scales only the *width* of its widgets',
                'as overall size changes, keeping heights fixed and scrolling as needed. This',
                "makes it well-suited for report-style dashboards with content that won't",
                'compress well on smaller screens. Use `DashContainer` when a space-filling',
                'layout is preferred.',
                '',
                'This example also demonstrates `DashCanvasWidgetChooser`, a ready-made',
                'sidebar for browsing and dragging available widgets onto the canvas.'
            ],
            options: [
                wrapperOption({
                    label: 'Render Dashboard',
                    control: switchInput({model, bind: 'renderDashboard'})
                }),
                wrapperOption({
                    label: 'Widget Chooser',
                    control: switchInput({model, bind: 'showWidgetChooser'})
                }),
                wrapperOption({
                    label: 'Columns',
                    propName: 'DashCanvasConfig.columns',
                    control: numberInput({
                        model: dashCanvasModel,
                        bind: 'columns',
                        width: 70,
                        commitOnChange: true
                    })
                }),
                wrapperOption({
                    label: 'Row Height',
                    propName: 'DashCanvasConfig.rowHeight',
                    control: numberInput({
                        model: dashCanvasModel,
                        bind: 'rowHeight',
                        width: 70,
                        valueLabel: 'px',
                        commitOnChange: true
                    })
                }),
                wrapperOption({
                    label: 'Compact',
                    propName: 'DashCanvasConfig.compact',
                    control: select({
                        model: dashCanvasModel,
                        bind: 'compact',
                        width: 130,
                        enableFilter: false,
                        options: [
                            {label: 'Vertical', value: 'vertical'},
                            {label: 'Horizontal', value: 'horizontal'},
                            {label: 'Off', value: false}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Show Background',
                    propName: 'DashCanvasConfig.showGridBackground',
                    control: switchInput({model: dashCanvasModel, bind: 'showGridBackground'})
                }),
                wrapperOption({
                    label: 'Layout Locked',
                    propName: 'DashCanvasConfig.layoutLocked',
                    control: switchInput({model: dashCanvasModel, bind: 'layoutLocked'})
                }),
                wrapperOption({
                    label: 'Content Locked',
                    propName: 'DashCanvasConfig.contentLocked',
                    control: switchInput({model: dashCanvasModel, bind: 'contentLocked'})
                }),
                wrapperOption({
                    label: 'Rename Locked',
                    propName: 'DashCanvasConfig.renameLocked',
                    control: switchInput({model: dashCanvasModel, bind: 'renameLocked'})
                }),
                wrapperAction({
                    text: 'Clear',
                    icon: Icon.cross(),
                    intent: 'danger',
                    onClick: () => model.clearCanvas()
                }),
                wrapperAction({
                    text: 'Reset State',
                    icon: Icon.reset(),
                    intent: 'danger',
                    onClick: () => model.resetState()
                })
            ],
            item: panel({
                className: 'dash-canvas-droppable-demo',
                width: '100%',
                height: '100%',
                item: hframe(
                    model.renderDashboard
                        ? dashCanvas({
                              omit: !dashCanvasModel // model is not created until async load of symbols completes
                          })
                        : frame({
                              item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                              padding: 10
                          }),
                    box({
                        omit: !model.showWidgetChooser || !model.renderDashboard,
                        width: 310,
                        style: {borderLeft: '1px solid var(--xh-border-color)'},
                        item: dashCanvasWidgetChooser({
                            dashCanvasModel
                        })
                    })
                )
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/dashCanvas/DashCanvasPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/dash/README.md#dashcanvas',
                    text: 'Dashboard docs',
                    notes: 'Dashboard system guide (DashCanvas and DashContainer).'
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
                    notes: 'Model for contained view instances.'
                }
            ]
        });
    }
});
