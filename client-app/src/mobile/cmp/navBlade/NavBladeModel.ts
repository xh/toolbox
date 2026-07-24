import {HoistModel, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observable} from '@xh/hoist/mobx';
import {ReactElement} from 'react';
import {DocService} from '../../../core/svc/DocService';

/** A single navigable leaf within the blade - maps to a fully-qualified app route. */
export interface NavBladeItem {
    text: string;
    /** Fully-qualified route name, e.g. `default.grid`. */
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

/** Route name of the standalone Docs section (the corpus-chooser landing). */
const DOCS_ROUTE = 'default.docs';

/**
 * App-bar center title for docs drill-down screens. The shell's `appBar` falls back to the app name
 * on an empty string, so we use a single space to leave it visually blank - the large in-body title
 * and the parent-named back chevron carry the context (iOS large-title style).
 */
const BLANK_TITLE = ' ';

/**
 * State + behavior for the mobile navigation blade (left drawer).
 *
 * Owns the open/closed state, the per-group expand/collapse state, and the static catalog of
 * navigable groups. Active-route detection reads `XH.routerState` so the blade can highlight the
 * user's current location. Built app-local for now; structured so it can later graduate into the
 * shared `@xh/hoist/mobile` kit.
 */
export class NavBladeModel extends HoistModel {
    @bindable accessor isOpen = false;

    /** Ids of the groups currently expanded in place. */
    @observable.ref accessor expandedIds: string[] = [];

    get homeRoute(): string {
        return HOME_ROUTE;
    }

    get docsRoute(): string {
        return DOCS_ROUTE;
    }

    readonly groups: NavBladeGroup[] = [
        {
            id: 'gridsAndData',
            text: 'Grids & Data',
            icon: Icon.grid(),
            items: [
                {text: 'Grid', route: 'default.grid'},
                {text: 'TreeGrid', route: 'default.treeGrid'},
                {text: 'ZoneGrid', route: 'default.zoneGrid'},
                {text: 'DataView', route: 'default.dataView'}
            ]
        },
        {
            id: 'charts',
            text: 'Charts',
            icon: Icon.chartLine(),
            items: [
                {text: 'Chart', route: 'default.chart'},
                {text: 'TreeMap', route: 'default.treeMap'}
            ]
        },
        {
            id: 'forms',
            text: 'Forms',
            icon: Icon.edit(),
            items: [
                {text: 'Form', route: 'default.form'},
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
                {text: 'Panel', route: 'default.panel'},
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
                {text: 'Popover', route: 'default.popover'},
                {text: 'Popups', route: 'default.popups'}
            ]
        }
    ];

    constructor() {
        super();

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
        return (
            name === HOME_ROUTE ||
            name === DOCS_ROUTE ||
            this.groups.some(g => g.items.some(it => it.route === name))
        );
    }

    /**
     * Display title for the active section, shown in the app bar in place of the app name. Resolves
     * the current route against the nav catalog, matching the nearest ancestor section - so a
     * drilldown route (e.g. a grid's single-record detail) keeps its parent section's title. Docs
     * drill-down screens (and the example doc reader) render their own large in-body title, so the
     * bar is left blank there.
     */
    get activeTitle(): string {
        const {name} = XH.routerState;
        if (name === HOME_ROUTE) return 'Home';
        if (name === DOCS_ROUTE) return 'Docs';
        if (name.startsWith(DOCS_ROUTE + '.') || name.endsWith('.doc')) return BLANK_TITLE;
        for (const group of this.groups) {
            const item = group.items.find(it => this.isRouteActive(it.route));
            if (item) return item.text;
        }
        return XH.clientAppName;
    }

    /**
     * Parent-screen name for the app-bar back chevron on the docs drill-down (iOS Settings style:
     * "< Docs", "< Hoist React", "< Concepts"). Returns null elsewhere so non-docs back buttons stay
     * icon-only, matching the rest of the app.
     */
    get backLabel(): string {
        const {name, params} = XH.routerState,
            docService = DocService.instance;
        switch (name) {
            case 'default.docs.corpus':
            case 'default.docs.search':
                return 'Docs';
            case 'default.docs.corpus.category':
                return docService.getSourceLabel(params.source);
            case 'default.docs.corpus.category.doc': {
                const cat = docService
                    .getCategories(params.source)
                    .find(c => c.id === params.categoryId);
                return cat?.title ?? docService.getSourceLabel(params.source);
            }
            case 'default.docs.search.doc':
                return 'Search';
            default:
                return null;
        }
    }
}
