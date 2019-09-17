import React from 'react';
import {hoistCmp, XH, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

import {wrapper} from '../../common/Wrapper';
import { PanelSizingModel } from './PanelSizingModel';

export const PanelSizingPanel = hoistCmp({
    model: creates(() => new PanelSizingModel()),

    render({model}) {
        return wrapper({
            description: (
                <div>
                    <p>
                        Panels support collapsing and drag-and-drop resizing via their <code>model</code> config,
                        optionally saving their sizing state in a per-user preference.
                    </p>
                    <p>
                        Note that the child panels below are also configured with
                        their <code>compactHeader</code> prop set to true.
                    </p>
                </div>
            ),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/PanelSizingPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/panel/Panel.js', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/panel/PanelModel.js', notes: 'Hoist component model (for resize / collapse).'}
            ],
            item: panel({
                title: 'Panels › Panel Sizing',
                icon: Icon.window(),
                height: 'calc(100% - 160px)',
                width: '80%',
                bbar: toolbar(
                    filler(),
                    switchInput({
                        label: 'Animate Resize',
                        onChange: () => model.setAnimateResizeAll(),
                        value: model.animateResize
                    })
                ),
                items: [
                    panel({
                        title: 'Top Panel 1',
                        icon: Icon.arrowToBottom(),
                        model: model.topPanel1Model,
                        compactHeader: true,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Top'
                        }),
                        headerItems: [
                            relativeTimestamp({
                                options: {prefix: 'Rendered'},
                                timestamp: Date.now(),
                                marginLeft: 4
                            }),
                            button({
                                icon: Icon.gear(),
                                minimal: true,
                                onClick: () => XH.toast({message: 'You clicked a Panel headerItem'})
                            })
                        ]
                    }),
                    panel({
                        title: 'Top Panel 2',
                        icon: Icon.arrowToBottom(),
                        model: model.topPanel2Model,
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
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Left'
                                })
                            }),
                            panel({
                                item: box({
                                    items: model.loremIpsum,
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
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Right'
                                })
                            })
                        ]
                    }),
                    panel({
                        title: 'Bottom Panel 2',
                        icon: Icon.arrowToBottom(),
                        model: model.bottomPanel2Model,
                        compactHeader: true,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
                        })
                    }),
                    panel({
                        title: 'Bottom Panel 1',
                        icon: Icon.arrowToBottom(),
                        model: model.bottomPanel1Model,
                        compactHeader: true,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
                        })
                    })
                ]
            })
        });
    }
});