import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, filler} from '@xh/hoist/cmp/layout';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class PanelContainerPanel extends Component {

    leftPanelModel = new PanelModel({
        defaultSize: 150,
        side: 'left'
    });

    rightPanelModel = new PanelModel({
        defaultSize: 150,
        side: 'right'
    });

    bottomPanelModel = new PanelModel({
        defaultSize: 130,
        side: 'bottom'
    });

    get allExpanded() {
        return !this.leftPanelModel.collapsed && !this.rightPanelModel.collapsed && !this.bottomPanelModel.collapsed;
    }

    get allCollapsed() {
        return this.leftPanelModel.collapsed && this.rightPanelModel.collapsed && this.bottomPanelModel.collapsed;
    }

    render() {
        return wrapper({
            description: `
                Panels support a number of important and frequent layout tasks. They include a header 
                bar with a standard icon, title, and header items. They accept props to create docked
                top and and bottom toolbars. Finally they support collapsing and drag-and-drop resizing, 
                optionally saving their sizing state in a per-user preference.
            `,
            item: panel({
                title: 'Containers › Panel',
                icon: Icon.window(),
                height: 450,
                width: 700,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Left Panel',
                                icon: Icon.arrowToLeft(),
                                model: this.leftPanelModel,
                                item: box({
                                    padding: 10,
                                    item: 'Collapsible Left'
                                })
                            }),
                            panel({
                                item: box({
                                    padding: 10,
                                    item: 'Main Content Area'
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
                                title: 'Right Panel',
                                icon: Icon.arrowToRight(),
                                model: this.rightPanelModel,
                                item: box({
                                    padding: 10,
                                    item: 'Collapsible Right'
                                })
                            })
                        ]
                    }),
                    panel({
                        title: 'Bottom Panel',
                        icon: Icon.arrowToBottom(),
                        model: this.bottomPanelModel,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
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
                                large: true,
                                onClick: () => XH.toast({message: 'You clicked a Panel headerItem'})
                            })
                        ]
                    })
                ]
            })
        });
    }

    setCollapsedAll(collapsed) {
        this.leftPanelModel.setCollapsed(collapsed);
        this.rightPanelModel.setCollapsed(collapsed);
        this.bottomPanelModel.setCollapsed(collapsed);
    }

}