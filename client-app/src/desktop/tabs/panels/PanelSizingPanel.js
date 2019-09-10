import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, filler, p, h3} from '@xh/hoist/cmp/layout';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class PanelSizingPanel extends Component {

    resizablePanelNames = [
        'topPanel1Model',
        'topPanel2Model',
        'leftPanel1Model',
        'leftPanel2Model',
        'rightPanel1Model',
        'rightPanel2Model',
        'bottomPanel1Model',
        'bottomPanel2Model'
    ];

    topPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'top'
    });

    topPanel2Model = new PanelModel({
        defaultSize: 100,
        side: 'top'
    });

    leftPanel1Model = new PanelModel({
        // resizable: false,
        defaultSize: 100,
        side: 'left'
    });

    leftPanel2Model = new PanelModel({
        defaultSize: 150,
        side: 'left'
    });

    rightPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'right'
    });

    rightPanel2Model = new PanelModel({
        defaultSize: 150,
        side: 'right'
    });

    bottomPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'bottom'
    });

    bottomPanel2Model = new PanelModel({
        defaultSize: 100,
        side: 'bottom'
    });

    get allExpanded() {
        return this.resizablePanelNames.every(it => !this[it].collapsed);
    }

    get allCollapsed() {
        return this.resizablePanelNames.every(it => this[it].collapsed);
    }

    render() {
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
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/PanelSizingPanel.js',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/Panel.js',
                    notes: 'Hoist component.'
                },
                {
                    url: '$HR/desktop/cmp/panel/PanelModel.js',
                    notes: 'Hoist component model (for resize / collapse).'
                }
            ],
            item: panel({
                title: 'Panels › Panel Sizing',
                icon: Icon.window(),
                height: 600,
                width: 800,
                items: [
                    panel({
                        title: 'Top Panel 1',
                        icon: Icon.arrowToBottom(),
                        model: this.topPanel1Model,
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
                        model: this.topPanel2Model,
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
                                model: this.leftPanel1Model,
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Left'
                                })
                            }),
                            panel({
                                title: 'Left Panel 2',
                                icon: Icon.arrowToLeft(),
                                model: this.leftPanel2Model,
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Left'
                                })
                            }),
                            panel({
                                item: box({
                                    items: this.loremIpsum,
                                    padding: '0 6 6 6',
                                    display: 'block',
                                    overflowY: 'auto'
                                }),
                                tbar: toolbar(
                                    filler(),
                                    button({
                                        text: 'Expand All',
                                        disabled: this.allExpanded,
                                        onClick: () => this.setCollapsedAll(false)
                                    }),
                                    button({
                                        text: 'Collapse All',
                                        disabled: this.allCollapsed,
                                        onClick: () => this.setCollapsedAll(true)
                                    })
                                )
                            }),
                            panel({
                                title: 'Right Panel 2',
                                icon: Icon.arrowToRight(),
                                model: this.rightPanel2Model,
                                compactHeader: true,
                                item: box({
                                    className: 'xh-pad',
                                    item: 'Collapsible Right'
                                })
                            }),
                            panel({
                                title: 'Right Panel 1',
                                icon: Icon.disabled(),
                                model: this.rightPanel1Model,
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
                        model: this.bottomPanel2Model,
                        compactHeader: true,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
                        })
                    }),
                    panel({
                        title: 'Bottom Panel 1',
                        icon: Icon.arrowToBottom(),
                        model: this.bottomPanel1Model,
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

    setCollapsedAll(collapsed) {
        this.resizablePanelNames.forEach(it => this[it].setCollapsed(collapsed));
    }

    loremIpsum = [
        h3({
            className: 'xh-text-color-accent',
            item: 'Some old-fashioned text content'
        }),
        p('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.)'),
        p('Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'),
        p('Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'),
        p('Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'),
        p('Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.')
    ]
}