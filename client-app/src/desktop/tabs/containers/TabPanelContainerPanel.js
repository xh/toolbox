import {div, hspacer, hbox} from '@xh/hoist/cmp/layout';
import {fmtTime} from '@xh/hoist/format';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {find, shuffle, isEmpty} from 'lodash';
import React from 'react';
import {wrapper} from '../../common/Wrapper';

export const tabPanelContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        const {stateTabModel, detachedTabModel, dynamicModel} = model;

        return wrapper({
            description: [
                <p>
                    TabContainers are configured and managed via a TabContainerModel and support
                    routing based navigation, managed mounting/unmounting of inactive tabs, and lazy
                    refreshing of its active Tab.
                </p>,
                <p>
                    The controls for switching tabs can be placed on any side of the container,
                    or omitted entirely via the <code>switcherPosition</code> prop.
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
                width: 700,
                height: 400,
                item: tabContainer({
                    model: {
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
                                    model: model.createContainerModelConfig({switcherPosition: 'bottom'})
                                })
                            },
                            {
                                id: 'left',
                                title: 'Left Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: model.createContainerModelConfig({switcherPosition: 'left'})
                                })
                            },
                            {
                                id: 'right',
                                title: 'Right Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: model.createContainerModelConfig({switcherPosition: 'right'})
                                })
                            },
                            {
                                id: 'custom',
                                title: 'Custom Switcher',
                                content: () => panel({
                                    className: 'child-tabcontainer',
                                    tbar: model.detachedTabModel.tabs.map(childModel => button({
                                        intent: childModel.isActive ? 'primary' : 'default',
                                        text: childModel.title,
                                        onClick: () => {
                                            detachedTabModel.setActiveTabId(childModel.id);
                                        }
                                    })),
                                    item: tabContainer({model: detachedTabModel})
                                })
                            },
                            {
                                id: 'state',
                                title: 'Tab State',
                                content: () => {
                                    const {tabs} = stateTabModel,
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
                                        item: tabContainer({model: stateTabModel})
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
                                            button({icon: Icon.add(), text:  'Add', onClick: () => model.addDynamic()}),
                                            button({icon: Icon.transaction(), text:  'Shuffle', onClick: () => model.shuffleDynamic()}),
                                            button({icon: Icon.x(), text:  'Remove First', onClick: () => model.removeDynamic()}),
                                            button({icon: Icon.xCircle(), text:  'Clear', onClick: () => model.clearDynamic()})
                                        ],
                                        item: tabContainer({model: dynamicModel})
                                    });
                                }
                            }
                        ]
                    }
                })
            })
        });
    }
});


@HoistModel
class Model {

    id = 0;

    @managed
    detachedTabModel = new TabContainerModel(this.createContainerModelConfig({switcherPosition: 'none'}));

    @managed
    stateTabModel = new TabContainerModel(this.createContainerModelConfig({}));

    @managed
    dynamicModel = new TabContainerModel({
        tabs: []
    });

    constructor() {
        this.addDynamic();
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
            id = this.id++;
        dynamicModel.addTab({
            id,
            title: hbox({
                alignItems: 'center',
                items: [
                    `Tab ${id}`,
                    hspacer(2),
                    button({
                        icon: Icon.x(),
                        onClick: () => dynamicModel.removeTab(id),
                        style: {minHeight: 15, minWidth: 15, borderRadius: 5, padding: 0}
                    })
                ]
            }),
            content: () => div(`Tab ${id}: Brand spanking new at ${fmtTime(new Date(), {fmt: 'HH:mm:ss'})}`)
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