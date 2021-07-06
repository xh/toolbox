import {div, hbox, hspacer, label} from '@xh/hoist/cmp/layout';
import {fmtTime} from '@xh/hoist/format';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, managed, hoistCmp, HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {button} from '@xh/hoist/desktop/cmp/button';
import {badge} from '@xh/hoist/desktop/cmp/badge';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {find, shuffle, isEmpty} from 'lodash';
import React from 'react';
import {wrapper} from '../../common';

export const tabPanelContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render() {
        return wrapper({
            description: [
                <p>
                    TabContainers are configured and managed via a TabContainerModel and support
                    routing based navigation, managed mounting/unmounting of inactive tabs, and lazy
                    refreshing of its active Tab.
                </p>,
                <p>
                    The controls for switching tabs can be placed on any side of the container,
                    or omitted entirely via the <code>switcher</code> prop.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/TabPanelContainerPanel.js', notes: 'This example.'},
                {url: '$TB/client-app/src/desktop/AppModel.js', notes: 'Toolbox AppModel with top-level TabContainerModel.'},
                {url: '$HR/cmp/tab/TabContainer.js', notes: 'Hoist container component.'},
                {url: '$HR/cmp/tab/TabContainerModel.js', notes: 'Hoist container model - primary API and configuration point for tabs.'},
                {url: '$HR/cmp/tab/TabModel.js', notes: 'Hoist tab model - created by TabContainerModel in its ctor from provided configs.'}
            ],
            item: panel({
                title: 'Containers › Tabs',
                icon: Icon.tab(),
                className: 'toolbox-containers-tabs',
                width: 760,
                height: 400,
                item: tabContainer({

                })
            })
        });
    }
});

class Model extends HoistModel {

    id = 0;

    @bindable
    badgeValue = 10;

    @bindable
    badgeIntent = 'none';

    @managed
    tabModel = new TabContainerModel({
        persistWith: {localStorageKey: 'tabExampleState'},
        tabs: [
            {
                id: 'top',
                title: 'Top Tabs',
                content: () => div(
                    `This overall example is a standard TabContainer with its switcher located in the default,
                                top position. Change the tabs above to see examples of other TabContainer configurations.`
                )
            },
            {
                id: 'bottom',
                title: 'Bottom Tabs',
                content: () => tabContainer({
                    className: 'child-tabcontainer',
                    model: this.createContainerModelConfig({
                        switcher: {orientation: 'bottom'}
                    })
                })
            },
            {
                id: 'left',
                title: 'Left Tabs',
                content: () => tabContainer({
                    className: 'child-tabcontainer',
                    model: this.createContainerModelConfig({
                        switcher: {orientation: 'left'}
                    })
                })
            },
            {
                id: 'right',
                title: 'Right Tabs',
                content: () => tabContainer({
                    className: 'child-tabcontainer',
                    model: this.createContainerModelConfig({
                        switcher: {orientation: 'right'}
                    })
                })
            },
            {
                id: 'custom',
                title: 'Custom Switcher',
                content: () => panel({
                    className: 'child-tabcontainer',
                    tbar: this.detachedTabModel.tabs.map(childModel => button({
                        intent: childModel.isActive ? 'primary' : null,
                        text: childModel.title,
                        onClick: () => {
                            this.detachedTabModel.setActiveTabId(childModel.id);
                        }
                    })),
                    item: tabContainer({model: this.detachedTabModel})
                })
            },
            {
                id: 'state',
                title: 'Tab State',
                content: () => {
                    const {tabs} = this.stateTabModel,
                        peopleTab = find(tabs, {id: 'people'}),
                        placesTab = find(tabs, {id: 'places'});

                    return panel({
                        className: 'child-tabcontainer',
                        bbar: [
                            switchInput({
                                model: peopleTab,
                                bind: 'disabled',
                                label: 'People Disabled?'
                            }),
                            hspacer(10),
                            'Places Tab Title: ',
                            textInput({
                                model: placesTab,
                                bind: 'title'
                            })
                        ],
                        item: tabContainer({model: this.stateTabModel})
                    });
                }
            },
            {
                id: 'dynamic',
                title: 'Dynamic',
                content: () => {
                    return panel({
                        className: 'child-tabcontainer',
                        bbar: [
                            button({icon: Icon.add(), text:  'Add', onClick: () => this.addDynamic()}),
                            button({icon: Icon.transaction(), text:  'Shuffle', onClick: () => this.shuffleDynamic()}),
                            button({icon: Icon.x(), text:  'Remove First', onClick: () => this.removeDynamic()}),
                            button({icon: Icon.xCircle(), text:  'Clear', onClick: () => this.clearDynamic()})
                        ],
                        item: tabContainer({model: this.dynamicModel})
                    });
                }
            },
            {
                id: 'badge',
                title: 'Badge',
                content: () => {
                    return panel({
                        className: 'child-tabcontainer',
                        items: [
                            div({
                                style: {padding: 10},
                                item: `Tabs can include a small, styled badge inline with the title, typically showing a 
                                count or other indicator that something is new or has content.`
                            })
                        ],
                        bbar: [
                            label('Badge Intent'),
                            select({
                                bind: 'badgeIntent',
                                options: ['none', 'primary', 'success', 'warning', 'danger'],
                                width: 100
                            }),
                            label('Badge Value'),
                            select({
                                bind: 'badgeValue',
                                options: ['New', 'Overdue!', 1, 100],
                                width: 100
                            })
                        ]
                    });
                }
            }
        ]
    });

    @managed
    detachedTabModel = new TabContainerModel(this.createContainerModelConfig({switcher: false}));

    @managed
    stateTabModel = new TabContainerModel(this.createContainerModelConfig({}));

    @managed
    dynamicModel = new TabContainerModel({
        tabs: [],
        switcher: {
            orientation: 'top',
            enableOverflow: true
        }
    });

    constructor() {
        super();
        makeObservable(this);

        this.addDynamic();

        this.addReaction({
            track: () => [this.badgeIntent, this.badgeValue],
            run: () => this.updateBadge(),
            fireImmediately: true
        });
    }

    updateBadge() {
        const tabWithBadge = this.tabModel.findTab('badge');
        tabWithBadge.setTitle(
            hbox({
                items: [
                    'Tab with Badge',
                    badge({
                        position: 'top',
                        item: this.badgeValue,
                        intent: this.badgeIntent
                    })
                ]
            })
        );
    }

    createContainerModelConfig(args) {
        const tabTxt = title => div(`This is the ${title} tab`);
        return {
            tabs: [
                {
                    id: 'people',
                    icon: Icon.user(),
                    content: () => tabTxt('People')
                },
                {
                    id: 'places',
                    icon: Icon.home(),
                    content: () => tabTxt('Places')
                },
                {
                    id: 'things',
                    icon: Icon.portfolio(),
                    content: () => tabTxt('Things')
                }
            ],
            ...args
        };
    }

    addDynamic() {
        const {dynamicModel} = this,
            icons = [Icon.user(), Icon.home(), Icon.portfolio()],
            id = this.id++,
            message = `Tab ${id}: Brand spanking new at ${fmtTime(new Date(), {fmt: 'HH:mm:ss'})}`;

        dynamicModel.addTab({
            id: id.toString(),
            icon: icons[id % icons.length],
            title: `Tab ${id}`,
            tooltip: message,
            showRemoveAction: true,
            content: () => div(message)
        }, {activateImmediately: true});
    }

    removeDynamic() {
        const {dynamicModel} = this;
        if (!isEmpty(dynamicModel.tabs)) {
            dynamicModel.removeTab(dynamicModel.tabs[0]);
        }
    }

    clearDynamic() {
        this.dynamicModel.setTabs([]);
    }

    shuffleDynamic() {
        const {dynamicModel} = this;
        dynamicModel.setTabs(shuffle(dynamicModel.tabs));
    }
}