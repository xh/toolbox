import {HoistModel, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {ReactElement} from 'react';

/** A single navigable leaf within the blade - maps to a fully-qualified app route. */
export interface NavBladeItem {
    text: string;
    /** Fully-qualified route name, e.g. `default.grids`. */
    route: string;
}

/** An expandable category of related examples, mirroring the desktop left sidebar grouping. */
export interface NavBladeGroup {
    id: string;
    text: string;
    icon: ReactElement;
    items: NavBladeItem[];
}

/** Route name of the standalone Home destination. */
const HOME_ROUTE = 'default';

/**
 * State + behavior for the mobile navigation blade (left drawer).
 *
 * Owns the open/closed state, the per-group expand/collapse state, and the static catalog of
 * navigable groups. Active-route detection reads `XH.routerState` so the blade can highlight the
 * user's current location. Built app-local for now; structured so it can later graduate into the
 * shared `@xh/hoist/mobile` kit.
 */
export class NavBladeModel extends HoistModel {
    @bindable isOpen = false;

    /** Ids of the groups currently expanded in place. */
    @observable.ref expandedIds: string[] = [];

    get homeRoute(): string {
        return HOME_ROUTE;
    }

    readonly groups: NavBladeGroup[] = [
        {
            id: 'gridsAndData',
            text: 'Grids & Data',
            icon: Icon.grid(),
            items: [
                {text: 'Grids', route: 'default.grids'},
                {text: 'Tree Grids', route: 'default.treegrids'},
                {text: 'Zone Grids', route: 'default.zoneGrid'},
                {text: 'DataViews', route: 'default.dataview'}
            ]
        },
        {
            id: 'charts',
            text: 'Charts',
            icon: Icon.chartLine(),
            items: [
                {text: 'Charts', route: 'default.charts'},
                {text: 'Tree Map', route: 'default.treeMap'}
            ]
        },
        {
            id: 'forms',
            text: 'Forms',
            icon: Icon.edit(),
            items: [
                {text: 'Forms', route: 'default.form'},
                {text: 'Inputs', route: 'default.inputs'},
                {text: 'Select', route: 'default.select'}
            ]
        },
        {
            id: 'layout',
            text: 'Layout',
            icon: Icon.layout(),
            items: [
                {text: 'Containers', route: 'default.containers'},
                {text: 'Panels', route: 'default.panels'},
                {text: 'Tabs', route: 'default.tabs'}
            ]
        },
        {
            id: 'components',
            text: 'Components',
            icon: Icon.cube(),
            items: [
                {text: 'Badges', route: 'default.badges'},
                {text: 'Buttons', route: 'default.buttons'},
                {text: 'Icons', route: 'default.icons'},
                {text: 'Mask', route: 'default.mask'},
                {text: 'PinPad', route: 'default.pinPad'},
                {text: 'Popovers', route: 'default.popovers'},
                {text: 'Popups', route: 'default.popups'}
            ]
        }
    ];

    constructor() {
        super();
        makeObservable(this);

        // Dismiss the blade on any route change - covers browser back/forward and any navigation
        // that originates outside the blade (mirrors how Hoist's built-in dialogs self-dismiss).
        this.addReaction({
            track: () => XH.routerState,
            run: () => (this.isOpen = false)
        });
    }

    @action
    open() {
        this.isOpen = true;
        // Land the user oriented: ensure the group holding the active route is expanded.
        const activeGroup = this.groups.find(g => g.items.some(it => this.isRouteActive(it.route)));
        if (activeGroup && !this.expandedIds.includes(activeGroup.id)) {
            this.expandedIds = [...this.expandedIds, activeGroup.id];
        }
    }

    @action
    toggleGroup(id: string) {
        this.expandedIds = this.expandedIds.includes(id)
            ? this.expandedIds.filter(it => it !== id)
            : [...this.expandedIds, id];
    }

    isGroupExpanded(id: string): boolean {
        return this.expandedIds.includes(id);
    }

    /** Navigate to the given route and close the blade. */
    navigateTo(route: string) {
        XH.navigate(route);
        this.isOpen = false;
    }

    /** True if the given route is the user's current location (or an ancestor of it). */
    isRouteActive(route: string): boolean {
        const {name} = XH.routerState;
        if (route === HOME_ROUTE) return name === HOME_ROUTE;
        return name === route || name.startsWith(route + '.');
    }

    /**
     * True when the active route is a destination reachable directly from the blade - i.e. Home or
     * one of the catalog's leaf items - as opposed to a deeper drilldown (e.g. a grid's single-record
     * detail). Drives the app bar's left slot: top-level pages keep the hamburger (open the blade);
     * drilldowns show the back affordance instead.
     */
    get isTopLevelRoute(): boolean {
        const {name} = XH.routerState;
        return name === HOME_ROUTE || this.groups.some(g => g.items.some(it => it.route === name));
    }

    /**
     * Display title for the active section, shown in the app bar in place of the app name. Resolves
     * the current route against the nav catalog, matching the nearest ancestor section - so a
     * drilldown route (e.g. a grid's single-record detail) keeps its parent section's title.
     */
    get activeTitle(): string {
        if (this.isRouteActive(HOME_ROUTE)) return 'Home';
        for (const group of this.groups) {
            const item = group.items.find(it => this.isRouteActive(it.route));
            if (item) return item.text;
        }
        return XH.clientAppName;
    }
}
