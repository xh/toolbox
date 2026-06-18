import {HoistModel, persist} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DEFAULT_WIDGET_IDS, WIDGETS, WidgetSpec, widgetSpec} from './widgets/WidgetCatalog';

/** Drag result shape from react-beautiful-dnd (kept local to avoid a kit type import). */
interface DragResult {
    draggableId: string;
    source: {droppableId: string; index: number};
    destination?: {droppableId: string; index: number};
}

/**
 * State + behavior for the mobile home widget dashboard.
 *
 * Owns the per-user membership and ordering of home widgets (split across two ordered lists - shown
 * "on your home" vs. parked under "available"), each widget's collapsed-to-title state, and the
 * transient open state of the Manage-widgets sheet. Membership/order/collapse persist per user via
 * a server-backed preference.
 *
 * A widget is on-home XOR available - never both - so the two lists fully partition the catalog.
 * The persisted lists are reconciled against the live catalog on every read, so adding or removing a
 * widget in code never corrupts a saved layout (new widgets default onto the home stack).
 */
export class HomeModel extends HoistModel {
    override persistWith = {prefKey: 'mobileHomeWidgets'};

    /** Ordered ids of widgets shown on the home stack. */
    @observable.ref @persist homeIds: string[] = DEFAULT_WIDGET_IDS;

    /** Ordered ids of widgets parked under "Available" (off the home stack). */
    @observable.ref @persist availableIds: string[] = [];

    /** Ids of widgets collapsed to just their title bar on the home stack. */
    @observable.ref @persist collapsedIds: string[] = [];

    /** Transient: whether the Manage-widgets pull-up sheet is expanded. */
    @bindable isManaging = false;

    /**
     * Snapshot of the home ids the dashboard is *displaying*, frozen while the Manage sheet is open.
     * Null when not managing - the dashboard then tracks the live committed state. See
     * {@link dashboardWidgets}.
     */
    @observable.ref private frozenDashboardIds: string[] = null;

    constructor() {
        super();
        makeObservable(this);

        // Defer the dashboard's reflow of widget order/membership until the Manage sheet closes, so
        // dnd reordering inside the sheet stays smooth (the dashboard's widgets are comparatively
        // heavy to re-render). While managing, the dashboard renders a frozen snapshot; on dismiss it
        // syncs to the committed state with a single re-render.
        this.addReaction({
            track: () => this.isManaging,
            run: managing =>
                runInAction(() => {
                    this.frozenDashboardIds = managing ? this.resolvedHomeIds : null;
                })
        });
    }

    /** Widgets the home dashboard should render - frozen to a snapshot while managing (see above). */
    get dashboardWidgets(): WidgetSpec[] {
        const ids = this.frozenDashboardIds ?? this.resolvedHomeIds;
        return ids.map(widgetSpec).filter(Boolean);
    }

    //------------------------
    // Resolved, catalog-reconciled membership
    //------------------------
    /** Ordered ids on the home stack, filtered to known widgets, with any new catalog widgets appended. */
    get resolvedHomeIds(): string[] {
        const known = new Set(WIDGETS.map(w => w.id)),
            available = new Set(this.availableIds.filter(id => known.has(id))),
            home = this.homeIds.filter(id => known.has(id) && !available.has(id)),
            placed = new Set([...home, ...available]),
            // Widgets new to the catalog (not in either saved list) default onto the home stack.
            unplaced = WIDGETS.map(w => w.id).filter(id => !placed.has(id));
        return [...home, ...unplaced];
    }

    /** Ordered ids under "Available", filtered to known widgets. */
    get resolvedAvailableIds(): string[] {
        const known = new Set(WIDGETS.map(w => w.id)),
            home = new Set(this.resolvedHomeIds);
        return this.availableIds.filter(id => known.has(id) && !home.has(id));
    }

    get homeWidgets(): WidgetSpec[] {
        return this.resolvedHomeIds.map(widgetSpec);
    }

    get availableWidgets(): WidgetSpec[] {
        return this.resolvedAvailableIds.map(widgetSpec);
    }

    //------------------------
    // Collapse state
    //------------------------
    isCollapsed(id: string): boolean {
        return this.collapsedIds.includes(id);
    }

    @action
    toggleCollapsed(id: string) {
        this.collapsedIds = this.collapsedIds.includes(id)
            ? this.collapsedIds.filter(it => it !== id)
            : [...this.collapsedIds, id];
    }

    //------------------------
    // Membership + ordering (driven by the Manage sheet)
    //------------------------
    /** Move a widget onto the home stack (appended) or off to Available (appended). */
    @action
    setOnHome(id: string, onHome: boolean) {
        const home = this.resolvedHomeIds.filter(it => it !== id),
            available = this.resolvedAvailableIds.filter(it => it !== id);
        if (onHome) {
            home.push(id);
        } else {
            available.push(id);
        }
        this.homeIds = home;
        this.availableIds = available;
    }

    /** Apply a drag-reorder across the two droppable lists ('home' / 'available'). */
    onDragEnd = (result: DragResult) => {
        const {draggableId, source, destination} = result;
        if (!destination) return; // dropped outside a list

        const home = [...this.resolvedHomeIds],
            available = [...this.resolvedAvailableIds],
            from = source.droppableId === 'home' ? home : available,
            to = destination.droppableId === 'home' ? home : available;

        from.splice(source.index, 1);
        to.splice(destination.index, 0, draggableId);

        runInAction(() => {
            this.homeIds = home;
            this.availableIds = available;
        });
    };

    @action
    restoreDefaults() {
        this.homeIds = DEFAULT_WIDGET_IDS;
        this.availableIds = [];
        this.collapsedIds = [];
    }
}
