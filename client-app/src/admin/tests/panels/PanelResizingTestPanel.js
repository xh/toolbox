import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, filler, hbox} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {PanelResizingTestModel} from './PanelResizingTestModel';

export const PanelResizingTestPanel = hoistCmp({
    model: creates(() => new PanelResizingTestModel()),

    render({ model }) {
        return panel({
            title: 'Panels › Panel Sizing',
            icon: Icon.window(),
            bbar: toolbar(
                filler(),
                switchInput({
                    label: 'Resize While Dragging',
                    onChange: () => model.toggleResizeWhileDraggingOnAll(),
                    value: model.resizeWhileDragging
                })
            ),
            items: [
                panel({
                    title: 'Top Panel 1',
                    icon: Icon.arrowToBottom(),
                    model: model.topPanel1Model,
                    key: model.topPanel1Model.xhId,
                    compactHeader: true,
                    item: box({
                        padding: 10,
                        item: `Collapsible Top (minSize: ${model.topPanel1Model.minSize}px)`
                    }),
                    headerItems: [
                        relativeTimestamp({
                            options: { prefix: 'Rendered' },
                            timestamp: Date.now(),
                            marginLeft: 4
                        }),
                        button({
                            icon: Icon.gear(),
                            minimal: true,
                            onClick: () => XH.toast({ message: 'You clicked a Panel headerItem' })
                        })
                    ]
                }),
                panel({
                    title: 'Top Panel 2',
                    icon: Icon.arrowToBottom(),
                    model: model.topPanel2Model,
                    key: model.topPanel2Model.xhId,
                    compactHeader: true,
                    item: box({
                        padding: 10,
                        item: 'Collapsible Top'
                    })
                }),
                hbox({
                    flex: 1,
                    className: 'xh-border-top',
                    items: [
                        panel({
                            title: 'Left Panel 1',
                            icon: Icon.disabled(),
                            model: model.leftPanel1Model,
                            key: model.leftPanel1Model.xhId,
                            compactHeader: true,
                            item: box({
                                className: 'xh-pad',
                                item: 'Collapsible Left'
                            })
                        }),
                        panel({
                            title: 'Left Panel 2',
                            icon: Icon.arrowToLeft(),
                            model: model.leftPanel2Model,
                            key: model.leftPanel2Model.xhId,
                            compactHeader: true,
                            item: box({
                                className: 'xh-pad',
                                item: `Collapsible Left (minSize: ${model.leftPanel2Model.minSize}px)`
                            })
                        }),
                        panel({
                            item: box({
                                items: model.explanation,
                                padding: '0 6 6 6',
                                display: 'block',
                                overflowY: 'auto'
                            }),
                            tbar: [
                                filler(),
                                button({
                                    text: 'Expand All',
                                    disabled: model.allExpanded,
                                    onClick: () => model.setCollapsedAll(false)
                                }),
                                button({
                                    text: 'Collapse All',
                                    disabled: model.allCollapsed,
                                    onClick: () => model.setCollapsedAll(true)
                                })
                            ]
                        }),
                        panel({
                            title: 'Right Panel 2',
                            icon: Icon.arrowToRight(),
                            model: model.rightPanel2Model,
                            key: model.rightPanel2Model.xhId,
                            compactHeader: true,
                            item: box({
                                className: 'xh-pad',
                                item: 'Collapsible Right'
                            })
                        }),
                        panel({
                            title: 'Right Panel 1',
                            icon: Icon.disabled(),
                            model: model.rightPanel1Model,
                            key: model.rightPanel1Model.xhId,
                            compactHeader: true,
                            item: box({
                                className: 'xh-pad',
                                item: `Collapsible Right (minSize: ${model.rightPanel1Model.minSize}px)`
                            })
                        })
                    ]
                }),
                panel({
                    title: 'Bottom Panel 2',
                    icon: Icon.arrowToBottom(),
                    model: model.bottomPanel2Model,
                    key: model.bottomPanel2Model.xhId,
                    compactHeader: true,
                    item: box({
                        padding: 10,
                        item: `Collapsible Bottom (minSize: ${model.bottomPanel2Model.minSize}px)`
                    })
                }),
                panel({
                    title: 'Bottom Panel 1',
                    icon: Icon.arrowToBottom(),
                    model: model.bottomPanel1Model,
                    key: model.bottomPanel1Model.xhId,
                    compactHeader: true,
                    item: box({
                        padding: 10,
                        item: 'Collapsible Bottom'
                    })
                })
            ]
        });
    }
});