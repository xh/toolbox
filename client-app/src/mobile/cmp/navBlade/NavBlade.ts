import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import classNames from 'classnames';
import type {ReactElement} from 'react';
import type {NavBladeGroup} from './NavBladeModel';
import {NavBladeModel} from './NavBladeModel';
import './NavBlade.scss';

/**
 * Left navigation drawer ("blade") for the mobile app - a scrim-backed drawer grouping the example
 * catalog. Triggered from the app-bar hamburger; dismissed by tapping the scrim, selecting a
 * destination, or any route change. Rendered as a fixed overlay so it floats above the navigator.
 */
export const navBlade = hoistCmp.factory({
    displayName: 'NavBlade',
    model: uses(NavBladeModel),

    render({model}) {
        return div({
            className: classNames('tb-nav-blade', model.isOpen && 'tb-nav-blade--open'),
            children: [
                div({
                    className: 'tb-nav-blade__scrim',
                    onClick: () => (model.isOpen = false)
                }),
                div({
                    className: 'tb-nav-blade__drawer',
                    children: [bladeHeader(), bladeNav({model}), bladeFooter({model})]
                })
            ]
        });
    }
});

const bladeHeader = hoistCmp.factory({
    render() {
        return hbox({
            className: 'tb-nav-blade__header',
            children: [
                Icon.boxFull({prefix: 'fal', size: '2x', className: 'tb-nav-blade__logo'}),
                vbox({
                    className: 'tb-nav-blade__header-text',
                    children: [
                        div({className: 'tb-nav-blade__title', children: 'Toolbox Mobile'}),
                        div({
                            className: 'tb-nav-blade__subtitle',
                            children: `v${XH.getEnv('clientVersion')} · ${XH.getEnv('appEnvironment')}`
                        })
                    ]
                })
            ]
        });
    }
});

const bladeNav = hoistCmp.factory<NavBladeModel>({
    model: uses(NavBladeModel),
    render({model}) {
        return div({
            className: 'tb-nav-blade__nav',
            children: [
                navRow({
                    icon: Icon.home(),
                    text: 'Home',
                    active: model.isRouteActive(model.homeRoute),
                    onClick: () => model.navigateTo(model.homeRoute)
                }),
                // Docs is a top-level destination, not an example - it sits directly under Home,
                // separated from the example-category groups by a hairline rule.
                navRow({
                    icon: Icon.book(),
                    text: 'Docs',
                    active: model.isRouteActive(model.docsRoute),
                    onClick: () => model.navigateTo(model.docsRoute)
                }),
                div({className: 'tb-nav-blade__rule'}),
                ...model.groups.map(group => navGroup({model, group}))
            ]
        });
    }
});

interface NavGroupProps extends HoistProps<NavBladeModel> {
    group: NavBladeGroup;
}

const navGroup = hoistCmp.factory<NavGroupProps>({
    model: uses(NavBladeModel),
    render({model, group}) {
        const expanded = model.isGroupExpanded(group.id);
        return div({
            className: 'tb-nav-blade__group',
            children: [
                navRow({
                    icon: group.icon,
                    text: group.text,
                    chevron: expanded ? Icon.chevronDown() : Icon.chevronRight(),
                    onClick: () => model.toggleGroup(group.id)
                }),
                div({
                    className: 'tb-nav-blade__sub-items',
                    omit: !expanded,
                    children: group.items.map(item =>
                        navRow({
                            text: item.text,
                            isSubItem: true,
                            active: model.isRouteActive(item.route),
                            onClick: () => model.navigateTo(item.route)
                        })
                    )
                })
            ]
        });
    }
});

interface NavRowProps extends HoistProps {
    text: string;
    icon?: ReactElement;
    chevron?: ReactElement;
    active?: boolean;
    isSubItem?: boolean;
    onClick: () => void;
}

const navRow = hoistCmp.factory<NavRowProps>({
    render({text, icon, chevron, active, isSubItem, onClick}) {
        return hbox({
            className: classNames(
                'tb-nav-blade__row',
                isSubItem && 'tb-nav-blade__row--sub',
                active && 'tb-nav-blade__row--active'
            ),
            onClick,
            children: [
                icon ? div({className: 'tb-nav-blade__row-icon', children: icon}) : null,
                span({className: 'tb-nav-blade__row-text', children: text}),
                filler(),
                chevron ? div({className: 'tb-nav-blade__row-chevron', children: chevron}) : null
            ]
        });
    }
});

const bladeFooter = hoistCmp.factory<NavBladeModel>({
    model: uses(NavBladeModel),
    render({model}) {
        return hbox({
            className: 'tb-nav-blade__footer',
            children: [
                button({
                    className: 'tb-nav-blade__footer-btn',
                    icon: XH.darkTheme ? Icon.sun() : Icon.moon(),
                    text: 'Theme',
                    minimal: true,
                    onClick: () => XH.toggleTheme()
                }),
                button({
                    className: 'tb-nav-blade__footer-btn',
                    icon: Icon.settings(),
                    text: 'Settings',
                    minimal: true,
                    onClick: () => {
                        model.isOpen = false;
                        XH.showOptionsDialog();
                    }
                })
            ]
        });
    }
});
