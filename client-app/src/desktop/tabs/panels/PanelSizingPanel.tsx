import React from 'react';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {box, filler, h3, hbox, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {wrapper} from '../../common';

export const panelSizingPanel = hoistCmp.factory({
    model: creates(() => PanelSizingModel),

    render({model}) {
        return wrapper({
            description: (
                <div>
                    <p>
                        Panels support collapsing, drag-and-drop resizing, and a toggleable modal
                        view via their
                        <code>PanelModel</code> config, optionally saving their sizing state in a
                        per-user preference.
                    </p>
                    <p>
                        By default the panel content does not re-layout until the resize bar is
                        dropped. Immediate or 'animated' resizing can be turned on by setting the
                        PanelModel config
                        <code>resizeWhileDragging</code> to <code>true</code>.
                    </p>
                    <p>
                        Note that the child panels below are also configured with their{' '}
                        <code>compactHeader</code> prop set to <code>true</code>.
                    </p>
                </div>
            ),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/PanelSizingPanel.tsx',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/panel/Panel.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/desktop/cmp/panel/PanelModel.ts',
                    notes: 'Hoist component model (for resize / collapse).'
                }
            ],
            item: panel({
                title: 'Panels › Panel Sizing',
                modelConfig: {modalSupport: true, collapsible: false, resizable: false},
                icon: Icon.window(),
                height: '60vh',
                width: '80%',
                bbar: toolbar(
                    filler(),
                    switchInput({
                        label: 'Resize While Dragging',
                        bind: 'resizeWhileDragging'
                    })
                ),
                items: [
                    hbox({
                        flex: 1,
                        className: 'xh-border-top',
                        items: [
                            panel({
                                title: 'Left Panel',
                                icon: Icon.arrowToLeft(),
                                model: model.leftPanelModel,
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Left'
                                })
                            }),
                            panel({
                                item: box({
                                    items: loremIpsum,
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
                                title: 'Right Panel',
                                icon: Icon.arrowToRight(),
                                model: model.rightPanelModel,
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Right with minSize and maxSize'
                                })
                            })
                        ]
                    }),
                    panel({
                        title: 'Bottom Panel',
                        icon: Icon.arrowToBottom(),
                        model: model.bottomPanelModel,
                        compactHeader: true,
                        item: box({
                            padding: 10,
                            item: (
                                <p>
                                    Collapsible Bottom with minSize and maxSize. I have{' '}
                                    <strong>modalSupport</strong> too! (See what happens when you
                                    make me a modal within a modal.)
                                </p>
                            )
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
                    })
                ]
            })
        });
    }
});

const loremIpsum = [
    h3({
        className: 'xh-text-color-accent',
        item: 'Some old-fashioned text content'
    }),
    p(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.)'
    ),
    p(
        'Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'
    ),
    p(
        'Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'
    ),
    p(
        'Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'
    ),
    p(
        'Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.'
    )
];

class PanelSizingModel extends HoistModel {
    @bindable resizeWhileDragging = false;

    @managed
    leftPanelModel = new PanelModel({
        defaultSize: '30%',
        maxSize: 300,
        minSize: 30,
        side: 'left'
    });

    @managed
    rightPanelModel = new PanelModel({
        defaultSize: '30%',
        maxSize: 300,
        minSize: 30,
        side: 'right'
    });

    @managed
    bottomPanelModel = new PanelModel({
        defaultSize: 150,
        side: 'bottom',
        maxSize: 350,
        minSize: 100,
        modalSupport: {width: 400, height: 200}
    });

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.resizeWhileDragging,
            run: resizeWhileDragging => {
                this.leftPanelModel.setResizeWhileDragging(resizeWhileDragging);
                this.rightPanelModel.setResizeWhileDragging(resizeWhileDragging);
                this.bottomPanelModel.setResizeWhileDragging(resizeWhileDragging);
            },
            fireImmediately: true
        });
    }

    get allExpanded() {
        return (
            !this.leftPanelModel.collapsed &&
            !this.rightPanelModel.collapsed &&
            !this.bottomPanelModel.collapsed
        );
    }

    get allCollapsed() {
        return (
            this.leftPanelModel.collapsed &&
            this.rightPanelModel.collapsed &&
            this.bottomPanelModel.collapsed
        );
    }

    setCollapsedAll(collapsed) {
        this.leftPanelModel.setCollapsed(collapsed);
        this.rightPanelModel.setCollapsed(collapsed);
        this.bottomPanelModel.setCollapsed(collapsed);
    }
}
