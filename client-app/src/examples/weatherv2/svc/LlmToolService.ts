import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import type {PlainObject} from '@xh/hoist/core';
import {HoistService, PersistableState, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {pluralize} from '@xh/hoist/utils/js';
import {countBy, groupBy, maxBy, mean} from 'lodash';
import type {AppModel} from '../AppModel';
import {temperatureIcon} from '../Icons';
import {viewManagers} from '../viewManagers';
import type {DashSpec, DashWidgetState} from '../dash/types';
import {validateSpec, migrateSpec, computeInstanceIds} from '../dash/validation';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {toMetricTemp, toMetricWind} from '../dash/unitUtils';
import type {WeatherData} from '../Types';

/**
 * Service that provides the Dashboard Agent's tools - the client-side operations the LLM calls to
 * change the dashboard and the app.
 *
 * Each tool is a `ChatToolSpec`: its name, description and input schema for the model, its title,
 * icon and summary for its row in the chat, and an `execute` function that runs it. Every tool
 * shows in the reply's activity timeline, so a dashboard build reads as one block that opens to
 * list each call. A tool returns a short result for the model, or throws an error written so the
 * model can correct itself.
 *
 * Dashboard tools (set_dashboard, add_widget, remove_widget, update_widget, move_widget,
 * list_widgets) provide structured, validated dashboard manipulation. The weather tool
 * (get_weather) reads a city's conditions and forecast, so the agent can answer a question in the
 * chat without changing the dashboard. App tools (save/load views, toggle theme, etc.) handle
 * non-dashboard operations.
 */
export class LlmToolService extends HoistService {
    static instance: LlmToolService;

    /** Tools for the Dashboard Agent's `ChatModel`. */
    readonly tools: ChatToolSpec[] = this.createTools();

    //------------------
    // Implementation
    //------------------
    private get appModel(): AppModel {
        return XH.appModel as AppModel;
    }

    private createTools(): ChatToolSpec[] {
        return [
            //----------------------------------------------
            // Dashboard tools
            //----------------------------------------------
            {
                name: 'set_dashboard',
                description:
                    'Replace the entire dashboard with a complete new spec. Use this when creating a ' +
                    'dashboard from scratch or making large-scale restructuring changes that affect most ' +
                    'widgets. The spec is validated before being applied. For smaller, targeted changes, ' +
                    'prefer add_widget, remove_widget, or update_widget.',
                parameters: objectSchema({spec: SPEC_SCHEMA}, ['spec']),
                displayName: 'Build dashboard',
                icon: Icon.gridLarge(),
                display: 'timeline',
                summary: ({input}) => {
                    const count = input?.spec?.state?.length;
                    return count ? pluralize('widget', count, true) : null;
                },
                execute: input => this.setDashboard(input.spec)
            },
            {
                name: 'add_widget',
                description:
                    'Add a single widget to the dashboard. The widget is appended and assigned the ' +
                    'next available instance ID for its type. Returns the new instance ID. If layout ' +
                    'is omitted, the widget is auto-placed at the bottom of the dashboard.',
                parameters: objectSchema(
                    {
                        viewSpecId: {
                            type: 'string',
                            description: 'Widget type to add (e.g. "forecastChart", "cityChooser").'
                        },
                        layout: {
                            ...LAYOUT_SCHEMA,
                            description:
                                'Grid position and size. Omit to auto-place at the bottom.',
                            required: ['x', 'y', 'w', 'h']
                        },
                        state: {
                            type: 'object',
                            description:
                                'Optional initial state with config keys and bindings. Example: ' +
                                '{"bindings": {"city": {"fromWidget": "cityChooser_0", "output": "selectedCity"}}, ' +
                                '"series": ["temp", "humidity"]}'
                        }
                    },
                    ['viewSpecId']
                ),
                displayName: 'Add widget',
                icon: Icon.add(),
                display: 'timeline',
                summary: ({input}) => widgetRegistry.get(input?.viewSpecId)?.title,
                execute: input => this.addWidget(input)
            },
            {
                name: 'remove_widget',
                description:
                    'Remove a widget from the dashboard by its instance ID. Will fail if other widgets ' +
                    'have bindings referencing this widget - update those bindings first.',
                parameters: objectSchema({instanceId: instanceIdSchema('remove')}, ['instanceId']),
                displayName: 'Remove widget',
                icon: Icon.delete(),
                display: 'timeline',
                summary: ({input}) => describeWidget(input?.instanceId),
                execute: input => this.removeWidget(input.instanceId)
            },
            {
                name: 'update_widget',
                description:
                    "Update a widget's configuration, bindings, and/or layout. State changes are " +
                    'merged with existing state - only the keys you provide are updated. Bindings are ' +
                    'also merged by input name. Use this for targeted changes like switching a chart type, ' +
                    'changing a binding, or adjusting position.',
                parameters: objectSchema(
                    {
                        instanceId: instanceIdSchema('update'),
                        state: {
                            type: 'object',
                            description:
                                'State changes to merge. Include "bindings" to update wiring, or config ' +
                                'keys to change settings. Example: {"chartType": "bar"} or ' +
                                '{"bindings": {"city": {"const": "Tokyo"}}}.'
                        },
                        layout: {
                            ...LAYOUT_SCHEMA,
                            description:
                                'Layout changes to merge. Only include the dimensions you want to change.'
                        }
                    },
                    ['instanceId']
                ),
                displayName: 'Update widget',
                icon: Icon.gear(),
                display: 'timeline',
                summary: ({input}) => describeWidget(input?.instanceId),
                execute: input => this.updateWidget(input)
            },
            {
                name: 'move_widget',
                description:
                    'Move or resize a widget by updating its layout position. Shorthand for ' +
                    'update_widget with only layout changes.',
                parameters: objectSchema(
                    {
                        instanceId: instanceIdSchema('move'),
                        layout: {
                            ...LAYOUT_SCHEMA,
                            description: 'New layout. Include only the dimensions to change.'
                        }
                    },
                    ['instanceId', 'layout']
                ),
                displayName: 'Move widget',
                icon: Icon.arrowsLeftRight(),
                display: 'timeline',
                summary: ({input}) => describeWidget(input?.instanceId),
                execute: input => this.moveWidget(input)
            },
            {
                name: 'list_widgets',
                description:
                    "Get the current dashboard widget inventory. Returns each widget's instance ID, " +
                    'type, layout, and state (including bindings). Use this to inspect the current ' +
                    'dashboard before making targeted changes.',
                parameters: objectSchema(),
                displayName: 'Review dashboard',
                icon: Icon.list(),
                display: 'timeline',
                execute: () => this.listWidgets()
            },

            //----------------------------------------------
            // Weather tools
            //----------------------------------------------
            {
                name: 'get_weather',
                description:
                    'Get the current conditions and the daily forecast for a city, for up to 5 ' +
                    'days. Use it to answer a question about the weather in the chat. It does not ' +
                    'change the dashboard.',
                parameters: objectSchema(
                    {
                        city: {
                            type: 'string',
                            description: 'City name, e.g. "Tokyo" or "Paris, FR".'
                        },
                        units: {
                            type: 'string',
                            enum: ['imperial', 'metric'],
                            description: 'imperial for °F and mph (default), metric for °C and m/s.'
                        }
                    },
                    ['city']
                ),
                displayName: 'Check weather',
                icon: temperatureIcon(),
                display: 'timeline',
                summary: ({input}) => input?.city,
                execute: input => this.getWeatherAsync(input.city, input.units)
            },

            //----------------------------------------------
            // App tools
            //----------------------------------------------
            {
                name: 'save_dashboard_as_view',
                description:
                    'Save the current dashboard layout as a new named view. The current dashboard state will be captured automatically.',
                parameters: objectSchema(
                    {
                        name: {
                            type: 'string',
                            description: 'The name for the saved view (e.g. "Tokyo Overview")'
                        }
                    },
                    ['name']
                ),
                displayName: 'Save view',
                icon: Icon.floppyDisk(),
                display: 'timeline',
                summary: ({input}) => input?.name,
                execute: input => this.saveViewAsync(input.name)
            },
            {
                name: 'switch_to_view',
                description:
                    "Switch to an existing saved view by name. The dashboard will update to show that view's layout.",
                parameters: objectSchema(
                    {
                        name: {
                            type: 'string',
                            description: 'The name of the saved view to switch to'
                        }
                    },
                    ['name']
                ),
                displayName: 'Open view',
                icon: Icon.folderOpen(),
                display: 'timeline',
                summary: ({input}) => input?.name,
                execute: input => this.switchToViewAsync(input.name)
            },
            {
                name: 'reset_dashboard',
                description:
                    "Reset the dashboard to the current view's last saved state, discarding any unsaved changes.",
                parameters: objectSchema(),
                displayName: 'Reset dashboard',
                icon: Icon.reset(),
                display: 'timeline',
                // Discards the user's unsaved changes, so the user confirms first.
                needsApproval: true,
                approvalPrompt:
                    'Discard your unsaved changes and reset the dashboard to its last saved state?',
                execute: () => this.resetDashboardAsync()
            },
            {
                name: 'toggle_theme',
                description: 'Toggle between light and dark theme for the entire application.',
                parameters: objectSchema(),
                displayName: 'Switch theme',
                icon: Icon.moon(),
                display: 'timeline',
                execute: () => this.toggleTheme()
            },
            {
                name: 'open_widget_chooser',
                description:
                    'Open the widget chooser panel so the user can manually browse and add widgets to the dashboard.',
                parameters: objectSchema(),
                displayName: 'Open widget chooser',
                icon: Icon.boxFull(),
                display: 'timeline',
                execute: () => this.openWidgetChooser()
            },
            {
                name: 'show_json_spec',
                description:
                    'Open the JSON spec editor panel so the user can view or manually edit the raw dashboard specification.',
                parameters: objectSchema(),
                displayName: 'Show JSON spec',
                icon: Icon.json(),
                display: 'timeline',
                execute: () => this.showJsonSpec()
            },
            {
                name: 'toggle_manual_editing',
                description:
                    "Toggle manual editing mode on or off. When enabled, the user can drag, resize, and add widgets directly. Useful for previewing exact layout sizing, and especially helpful whenever a user asks to hide a widget's title bar - enabling manual editing lets them see and adjust the resulting layout.",
                parameters: objectSchema(),
                displayName: 'Toggle manual editing',
                icon: Icon.edit(),
                display: 'timeline',
                execute: () => this.toggleManualEditing()
            }
        ];
    }

    //----------------------------------------------
    // Dashboard tool implementations
    //----------------------------------------------
    /** Replace the entire dashboard with a new spec. */
    private setDashboard(rawSpec: DashSpec): string {
        if (!rawSpec || !Array.isArray(rawSpec.state)) {
            throw new Error('spec must be an object with a "state" array.');
        }

        const spec = migrateSpec({version: rawSpec.version ?? 1, state: rawSpec.state});
        this.applyState(spec.state, 'Validation failed');

        const ids = computeInstanceIds(spec.state);
        return `Dashboard updated with ${spec.state.length} widgets: ${ids.join(', ')}.`;
    }

    /** Add a single widget to the dashboard. */
    private addWidget({viewSpecId, layout, state}: PlainObject): string {
        if (!viewSpecId || !widgetRegistry.has(viewSpecId)) {
            const available = widgetRegistry.getIds().join(', ');
            throw new Error(`Invalid viewSpecId "${viewSpecId}". Available types: ${available}.`);
        }

        const newWidget: DashWidgetState = {
            viewSpecId,
            layout: layout ?? this.getAutoLayout(viewSpecId)
        };
        if (state) newWidget.state = state;

        const newState = [...this.currentState, newWidget];
        this.applyState(newState, 'Cannot add widget - validation failed');

        const newId = computeInstanceIds(newState).at(-1);
        return `Added ${viewSpecId} widget as "${newId}".`;
    }

    /** Remove a widget by instance ID. */
    private removeWidget(instanceId: string): string {
        const {currentState} = this,
            idx = this.findWidgetIndex(instanceId),
            newState = currentState.filter((_, i) => i !== idx);

        // Removal can break bindings that reference the removed widget.
        this.applyState(
            newState,
            `Cannot remove "${instanceId}" - validation failed`,
            'Other widgets may have bindings referencing this widget. ' +
                'Update or remove those bindings first.'
        );
        return `Removed widget "${instanceId}". Dashboard now has ${newState.length} widgets.`;
    }

    /** Update a widget's state (config, bindings) and/or layout by instance ID. */
    private updateWidget({
        instanceId,
        state: stateChanges,
        layout: layoutChanges
    }: PlainObject): string {
        if (!stateChanges && !layoutChanges) {
            throw new Error('At least one of "state" or "layout" must be provided.');
        }

        const newState = [...this.currentState],
            idx = this.findWidgetIndex(instanceId),
            widget = {...newState[idx]};

        // Shallow-merge state changes, merging bindings by input name.
        if (stateChanges) {
            const {bindings, ...config} = stateChanges,
                existing = widget.state ?? {};
            widget.state = {...existing, ...config};
            if (bindings) widget.state.bindings = {...existing.bindings, ...bindings};
        }
        if (layoutChanges) {
            widget.layout = {...widget.layout, ...layoutChanges};
        }

        newState[idx] = widget;
        this.applyState(newState, `Cannot update "${instanceId}" - validation failed`);
        return `Updated widget "${instanceId}".`;
    }

    /** Move/resize a widget by instance ID. */
    private moveWidget({instanceId, layout}: PlainObject): string {
        if (!layout) throw new Error('layout is required.');
        return this.updateWidget({instanceId, layout});
    }

    /** List current widgets with instance IDs, types, layouts, and state. */
    private listWidgets(): string {
        const {currentState} = this,
            ids = computeInstanceIds(currentState),
            widgets = currentState.map((widget, idx) => ({
                instanceId: ids[idx],
                viewSpecId: widget.viewSpecId,
                layout: widget.layout,
                state: widget.state ?? {}
            }));

        return JSON.stringify(widgets, null, 2);
    }

    //----------------------------------------------
    // Weather tool implementations
    //----------------------------------------------
    /**
     * A city's current conditions and its forecast by day, compact for the model: each day's
     * weekday, high, low, most common conditions, highest chance of precipitation and mean wind.
     * The feed has one entry per 3 hours for 5 days, so the first and last days are usually cut
     * short - a day with fewer than 8 entries is marked `partial`, as its figures cover only part
     * of it.
     */
    private async getWeatherAsync(city: string, units: string = 'imperial'): Promise<PlainObject> {
        if (!city?.trim()) throw new Error('city is required.');

        const data: WeatherData = await XH.weatherDataService.ensureDataAsync(city.trim()),
            {current, forecast} = data,
            metric = units === 'metric',
            temp = (f: number) => (metric ? toMetricTemp(f) : Math.round(f)),
            wind = (mph: number) => (metric ? toMetricWind(mph) : Math.round(mph)),
            byDay = groupBy(forecast, it => toDateKey(it.dt));

        return {
            city: data.city,
            units: metric ? {temp: '°C', wind: 'm/s'} : {temp: '°F', wind: 'mph'},
            current: {
                temp: temp(current.temp),
                feelsLike: temp(current.feelsLike),
                conditions: current.description || current.conditions,
                humidity: current.humidity,
                wind: wind(current.windSpeed)
            },
            daily: Object.entries(byDay).map(([date, entries]) => ({
                date,
                day: new Date(entries[0].dt).toLocaleDateString('en-US', {weekday: 'short'}),
                ...(entries.length < 8 ? {partial: true} : {}),
                high: temp(maxBy(entries, 'tempMax').tempMax),
                low: temp(Math.min(...entries.map(it => it.tempMin))),
                conditions: maxBy(Object.entries(countBy(entries, 'conditions')), 1)[0],
                precipChance: Math.max(...entries.map(it => it.precipProbability)),
                wind: wind(mean(entries.map(it => it.windSpeed)))
            }))
        };
    }

    //----------------------------------------------
    // App tool implementations
    //----------------------------------------------
    private async saveViewAsync(name: string): Promise<string> {
        name = name?.trim();
        if (!name) throw new Error('View name is required.');

        const viewManager = viewManagers.weatherDashboardV2;
        await viewManager.saveAsAsync({
            name,
            group: null,
            description: '',
            isShared: false,
            isGlobal: false,
            value: viewManager.getValue()
        });
        return `View "${name}" saved successfully.`;
    }

    private async switchToViewAsync(name: string): Promise<string> {
        name = name?.trim();
        if (!name) throw new Error('View name is required.');

        const viewManager = viewManagers.weatherDashboardV2,
            target = viewManager.views.find(v => v.name.toLowerCase() === name.toLowerCase());
        if (!target) {
            const available = viewManager.views.map(v => v.name).join(', ');
            throw new Error(
                `No view found matching "${name}". Available views: ${available || 'none'}`
            );
        }

        await viewManager.selectViewAsync(target, {alertUnsavedChanges: false});
        return `Switched to view "${target.name}".`;
    }

    private async resetDashboardAsync(): Promise<string> {
        await viewManagers.weatherDashboardV2.resetAsync();
        return "Dashboard reset to the current view's saved state.";
    }

    private toggleTheme(): string {
        XH.toggleTheme();
        return `Theme toggled to ${XH.darkTheme ? 'dark' : 'light'} mode.`;
    }

    private openWidgetChooser(): string {
        this.appModel.showWidgetChooser = true;
        return 'Widget chooser panel opened.';
    }

    private showJsonSpec(): string {
        this.appModel.showJsonHarness = true;
        return 'JSON spec editor opened.';
    }

    private toggleManualEditing(): string {
        const {appModel} = this,
            enabled = !appModel.manualEditingEnabled;
        appModel.manualEditingEnabled = enabled;
        return `Manual editing ${enabled ? 'enabled' : 'disabled'}.`;
    }

    //----------------------------------------------
    // Helpers
    //----------------------------------------------
    /** The current dashboard's widgets. */
    private get currentState(): DashWidgetState[] {
        return this.appModel.weatherV2DashModel.spec.state;
    }

    /** Index of a widget in the current state, or an error that lists the valid IDs. */
    private findWidgetIndex(instanceId: string): number {
        if (!instanceId) throw new Error('instanceId is required.');

        const ids = computeInstanceIds(this.currentState),
            idx = ids.indexOf(instanceId);
        if (idx === -1) {
            throw new Error(
                `No widget found with instanceId "${instanceId}". ` +
                    `Current widgets: ${ids.join(', ')}.`
            );
        }
        return idx;
    }

    /** Validate a new state array and apply it to the dashboard, or throw its errors. */
    private applyState(state: DashWidgetState[], errorPrefix: string, errorHint: string = null) {
        const result = validateSpec({version: 1, state});
        if (!result.valid) {
            const errors = result.errors.map(e => e.message).join('; ');
            throw new Error([`${errorPrefix}: ${errors}.`, errorHint].filter(Boolean).join(' '));
        }

        const {dashCanvasModel} = this.appModel.weatherV2DashModel;
        dashCanvasModel.setPersistableState(new PersistableState({state}));
    }

    /** Compute a reasonable auto-placement layout for a new widget. */
    private getAutoLayout(viewSpecId: string): DashWidgetState['layout'] {
        const meta = widgetRegistry.get(viewSpecId),
            w = meta?.defaultSize?.w ?? 6,
            h = meta?.defaultSize?.h ?? 6,
            // Place at the bottom of the current dashboard.
            y = Math.max(
                0,
                ...this.currentState.map(it => (it.layout?.y ?? 0) + (it.layout?.h ?? 0))
            );

        return {x: 0, y, w, h};
    }
}

//--------------------------------------------------
// Tool schemas and display helpers
//--------------------------------------------------
/** A forecast time as a local `YYYY-MM-DD` date - the day it falls on, as the widgets group it. */
function toDateKey(dt: number): string {
    const d = new Date(dt),
        pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function objectSchema(properties: PlainObject = {}, required: string[] = []): PlainObject {
    return {type: 'object', properties, required};
}

function instanceIdSchema(verb: string): PlainObject {
    return {
        type: 'string',
        description: `Instance ID of the widget to ${verb} (e.g. "forecastChart_0").`
    };
}

const LAYOUT_SCHEMA = {
    type: 'object',
    properties: {
        x: {type: 'number', description: 'Column (0-11)'},
        y: {type: 'number', description: 'Row'},
        w: {type: 'number', description: 'Width in columns (1-12)'},
        h: {type: 'number', description: 'Height in rows'}
    }
};

const SPEC_SCHEMA = {
    type: 'object',
    description:
        'Complete dashboard spec with "version" (number, typically 1) and ' +
        '"state" (array of widget objects). Each widget has: viewSpecId (string), ' +
        'layout ({x, y, w, h}), and optional state ({bindings, ...config}).',
    properties: {
        version: {type: 'number'},
        state: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    viewSpecId: {type: 'string'},
                    layout: {...LAYOUT_SCHEMA, required: ['x', 'y', 'w', 'h']},
                    state: {type: 'object'}
                },
                required: ['viewSpecId', 'layout']
            }
        }
    },
    required: ['state']
};

/**
 * A widget instance ID as a readable label for a tool call card - "forecastChart_1" becomes
 * "Forecast Chart 2". Returns null while the ID is still streaming in.
 */
function describeWidget(instanceId: string): string {
    const [, viewSpecId, idx] = /^(.+)_(\d+)$/.exec(instanceId ?? '') ?? [],
        title = widgetRegistry.get(viewSpecId)?.title;
    if (!title) return instanceId ?? null;
    return idx === '0' ? title : `${title} ${Number(idx) + 1}`;
}
