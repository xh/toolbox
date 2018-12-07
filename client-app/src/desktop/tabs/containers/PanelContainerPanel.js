import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, filler} from '@xh/hoist/cmp/layout';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class PanelContainerPanel extends Component {

    leftSizingModel = new PanelSizingModel({
        defaultSize: 125,
        side: 'left'
    });

    rightSizingModel = new PanelSizingModel({
        defaultSize: 125,
        side: 'right'
    });

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 130,
        side: 'bottom'
    });

    get allExpanded() {
        return !this.leftSizingModel.collapsed && !this.rightSizingModel.collapsed && !this.bottomSizingModel.collapsed;
    }

    get allCollapsed() {
        return this.leftSizingModel.collapsed && this.rightSizingModel.collapsed && this.bottomSizingModel.collapsed;
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
                title: 'Containers > Panel',
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
                                sizingModel: this.leftSizingModel,
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
                                sizingModel: this.rightSizingModel,
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
                        sizingModel: this.bottomSizingModel,
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
        this.leftSizingModel.setCollapsed(collapsed);
        this.rightSizingModel.setCollapsed(collapsed);
        this.bottomSizingModel.setCollapsed(collapsed);
    }

}