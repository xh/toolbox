import {div, filler, img, vbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, HoistUser, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {drawer, drawerToggleButton} from '@xh/hoist/desktop/cmp/drawer';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dynamicTabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {Icon} from '@xh/hoist/icon';
import {profilePic, welcomeMsg} from '../core/cmp';
// @ts-ignore
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';
import {AppModel} from './AppModel';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const renderWithUserProfile = model.renderWithUserProfile
            ? (user: HoistUser) => profilePic({user})
            : false;

        return panel({
            tbar: appBar({
                icon: img({
                    src: xhLogo,
                    onClick: () => model.navDrawerModel.toggleOverlay()
                }),
                title: null,
                leftItems: [dynamicTabSwitcher()],
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false,
                appMenuButtonProps: {
                    renderWithUserProfile,
                    hideLogoutItem: false,
                    extraItems: [welcomeMsg({multiline: true})]
                }
            }),
            hotkeys: [
                {
                    label: 'Switch to the home tab',
                    combo: 'shift + h',
                    global: true,
                    onKeyDown: () => model.goHome()
                }
            ],
            lDrawer: drawer({
                model: model.navDrawerModel,
                title: 'Toolbox',
                icon: Icon.books(),
                collapsedItems: navCollapsedItems(model),
                items: [navMenu({model})]
            }),
            item: tabContainer({
                switcher: false,
                childContainerProps: {switcher: {orientation: 'left', className: 'tb-switcher'}}
            }),
            mask: 'onLoad'
        });
    }
});

//---------------------
// Nav Drawer Content
//---------------------
const NAV_SECTIONS = [
    {id: 'home', title: 'Home', icon: Icon.home()},
    {
        id: 'grids',
        title: 'Grids',
        icon: Icon.grid(),
        children: [
            {id: 'standard', title: 'Standard'},
            {id: 'tree', title: 'Tree'},
            {id: 'columnFiltering', title: 'Column Filtering'},
            {id: 'inlineEditing', title: 'Inline Editing'},
            {id: 'zoneGrid', title: 'Zone Grid'},
            {id: 'dataview', title: 'DataView'}
        ]
    },
    {
        id: 'panels',
        title: 'Panels',
        icon: Icon.window(),
        children: [
            {id: 'intro', title: 'Intro'},
            {id: 'toolbars', title: 'Toolbars'},
            {id: 'sizing', title: 'Sizing'},
            {id: 'drawers', title: 'Drawers'},
            {id: 'mask', title: 'Mask'}
        ]
    },
    {
        id: 'layout',
        title: 'Layout',
        icon: Icon.layout(),
        children: [
            {id: 'hbox', title: 'HBox'},
            {id: 'vbox', title: 'VBox'},
            {id: 'card', title: 'Card'},
            {id: 'tabPanel', title: 'TabContainer'},
            {id: 'dashContainer', title: 'DashContainer'}
        ]
    },
    {
        id: 'forms',
        title: 'Forms',
        icon: Icon.edit(),
        children: [
            {id: 'form', title: 'FormModel'},
            {id: 'inputs', title: 'Hoist Inputs'},
            {id: 'select', title: 'Select'},
            {id: 'picker', title: 'Picker'}
        ]
    },
    {
        id: 'charts',
        title: 'Charts',
        icon: Icon.chartLine(),
        children: [
            {id: 'line', title: 'Line'},
            {id: 'ohlc', title: 'OHLC'},
            {id: 'simpleTreeMap', title: 'TreeMap'}
        ]
    },
    {id: 'other', title: 'Other', icon: Icon.boxFull()},
    {id: 'docs', title: 'Docs', icon: Icon.book()},
    {id: 'examples', title: 'Examples', icon: Icon.books()}
];

function navCollapsedItems(model: AppModel) {
    return [
        ...NAV_SECTIONS.filter(s => !s.children).map(section =>
            button({
                icon: section.icon,
                minimal: true,
                tooltip: section.title,
                onClick: () => {
                    model.tabModel.activateTab(section.id);
                    model.navDrawerModel.closeOverlay();
                }
            })
        ),
        filler(),
        drawerToggleButton({
            drawerModel: model.navDrawerModel,
            action: 'pin'
        })
    ];
}

const navMenu = hoistCmp.factory({
    model: false,
    render({model}: any) {
        const {navDrawerModel} = model,
            isPinned = navDrawerModel.isPinned;

        return vbox({
            className: 'tb-nav-menu',
            items: [
                ...NAV_SECTIONS.map(section => navSection({section, model})),
                filler(),
                div({
                    className: 'tb-nav-menu__footer',
                    items: [
                        button({
                            icon: isPinned ? Icon.arrowToLeft() : Icon.arrowToRight(),
                            text: isPinned ? 'Unpin' : 'Pin Menu',
                            minimal: true,
                            onClick: () =>
                                isPinned ? navDrawerModel.setMode('overlay') : navDrawerModel.pin()
                        })
                    ]
                })
            ]
        });
    }
});

const navSection = hoistCmp.factory({
    model: false,
    observer: true,
    render({section, model}: any) {
        const {tabModel, navDrawerModel} = model,
            isActive = tabModel.activeTabId === section.id,
            navTo = (tabId: string, subTabId?: string) => {
                tabModel.activateTab(tabId);
                if (subTabId) {
                    const tab = tabModel.findTab(tabId);
                    tab?.content?.activateTab?.(subTabId);
                }
                if (!navDrawerModel.isPinned) navDrawerModel.closeOverlay();
            };

        return div({
            className: 'tb-nav-menu__section',
            items: [
                button({
                    className: isActive ? 'tb-nav-menu__item--active' : null,
                    icon: section.icon,
                    text: section.title,
                    minimal: true,
                    onClick: () => navTo(section.id),
                    style: {justifyContent: 'flex-start', width: '100%'}
                }),
                ...(section.children && isActive
                    ? section.children.map(child =>
                          button({
                              text: child.title,
                              minimal: true,
                              onClick: () => navTo(section.id, child.id),
                              style: {
                                  justifyContent: 'flex-start',
                                  width: '100%',
                                  paddingLeft: 32
                              }
                          })
                      )
                    : [])
            ]
        });
    }
});
