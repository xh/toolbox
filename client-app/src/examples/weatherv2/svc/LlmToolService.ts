import {HoistService, PersistableState, XH} from '@xh/hoist/core';
import {AppModel} from '../AppModel';
import {DashSpec, DashWidgetState} from '../dash/types';
import {validateSpec, migrateSpec, computeInstanceIds} from '../dash/validation';
import {widgetRegistry} from '../dash/WidgetRegistry';

export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

/**
 * Service that defines and executes LLM tools (function calling).
 *
 * Tools are client-side operations that manipulate app and dashboard state.
 * The LLM chooses when to call them based on the user's natural language requests.
 *
 * Dashboard tools (set_dashboard, add_widget, remove_widget, update_widget,
 * move_widget, list_widgets) provide structured, validated dashboard manipulation.
 * App tools (save/load views, toggle theme, etc.) handle non-dashboard operations.
 */
export class LlmToolService extends HoistService {
    static instance: LlmToolService;

    /** Return Anthropic-format tool definitions for the API request. */
    getToolDefinitions(): ToolDefinition[] {
        return TOOL_DEFINITIONS;
    }

    /** Execute a tool call and return a result string. */
    async executeToolAsync(
        name: string,
        input: Record<string, any>
    ): Promise<{content: string; isError: boolean}> {
        try {
            const result = await this.doExecuteAsync(name, input);
            return {content: result, isError: false};
        } catch (e) {
            return {content: e.message || `Tool "${name}" failed.`, isError: true};
        }
    }

    //------------------
    // Implementation
    //------------------
    private async doExecuteAsync(name: string, input: Record<string, any>): Promise<string> {
        const appModel = AppModel.instance,
            viewManager = appModel.weatherViewManager;

        switch (name) {
            //----------------------------------------------
            // Dashboard manipulation tools
            //----------------------------------------------
            case 'set_dashboard':
                return this.doSetDashboard(input);

            case 'add_widget':
                return this.doAddWidget(input);

            case 'remove_widget':
                return this.doRemoveWidget(input);

            case 'update_widget':
                return this.doUpdateWidget(input);

            case 'move_widget':
                return this.doMoveWidget(input);

            case 'list_widgets':
                return this.doListWidgets();

            //----------------------------------------------
            // App operation tools
            //----------------------------------------------
            case 'save_dashboard_as_view': {
                const viewName = input.name as string;
                if (!viewName?.trim()) throw new Error('View name is required.');
                await viewManager.saveAsAsync({
                    name: viewName.trim(),
                    group: null,
                    description: '',
                    isShared: false,
                    isGlobal: false,
                    value: viewManager.getValue()
                });
                return `View "${viewName.trim()}" saved successfully.`;
            }

            case 'switch_to_view': {
                const viewName = input.name as string;
                if (!viewName?.trim()) throw new Error('View name is required.');
                const target = viewManager.views.find(
                    v => v.name.toLowerCase() === viewName.trim().toLowerCase()
                );
                if (!target) {
                    const available = viewManager.views.map(v => v.name).join(', ');
                    throw new Error(
                        `No view found matching "${viewName}". Available views: ${available || 'none'}`
                    );
                }
                await viewManager.selectViewAsync(target, {alertUnsavedChanges: false});
                return `Switched to view "${target.name}".`;
            }

            case 'reset_dashboard': {
                await viewManager.resetAsync();
                return "Dashboard reset to the current view's saved state.";
            }

            case 'toggle_theme': {
                XH.toggleTheme();
                const newTheme = XH.darkTheme ? 'dark' : 'light';
                return `Theme toggled to ${newTheme} mode.`;
            }

            case 'open_widget_chooser': {
                appModel.showWidgetChooser = true;
                return 'Widget chooser panel opened.';
            }

            case 'show_json_spec': {
                appModel.showJsonHarness = true;
                return 'JSON spec editor opened.';
            }

            case 'toggle_manual_editing': {
                const newVal = !appModel.manualEditingEnabled;
                appModel.manualEditingEnabled = newVal;
                return `Manual editing ${newVal ? 'enabled' : 'disabled'}.`;
            }

            default:
                throw new Error(`Unknown tool: "${name}"`);
        }
    }

    //----------------------------------------------
    // Dashboard tool implementations
    //----------------------------------------------

    /** Replace the entire dashboard with a new spec. */
    private doSetDashboard(input: Record<string, any>): string {
        const rawSpec = input.spec as DashSpec;
        if (!rawSpec || !Array.isArray(rawSpec.state)) {
            throw new Error('spec must be an object with a "state" array.');
        }

        const spec = migrateSpec({version: rawSpec.version ?? 1, state: rawSpec.state});
        const result = validateSpec(spec);
        if (!result.valid) {
            const errorSummary = result.errors.map(e => e.message).join('; ');
            throw new Error(`Validation failed: ${errorSummary}`);
        }

        this.applyState(spec.state);

        const ids = computeInstanceIds(spec.state);
        const widgetSummary = ids.join(', ');
        return `Dashboard updated with ${spec.state.length} widgets: ${widgetSummary}.`;
    }

    /** Add a single widget to the dashboard. */
    private doAddWidget(input: Record<string, any>): string {
        const {viewSpecId, layout, state: widgetState} = input;

        if (!viewSpecId || !widgetRegistry.has(viewSpecId)) {
            const available = widgetRegistry.getIds().join(', ');
            throw new Error(`Invalid viewSpecId "${viewSpecId}". Available types: ${available}.`);
        }

        const currentState = this.getCurrentStateArray();

        // Build the new widget entry
        const newWidget: DashWidgetState = {
            viewSpecId,
            layout: layout ?? this.getAutoLayout(viewSpecId)
        };
        if (widgetState) newWidget.state = widgetState as Record<string, any>;

        const newState = [...currentState, newWidget];

        // Validate the resulting full spec
        const spec: DashSpec = {version: 1, state: newState};
        const result = validateSpec(spec);
        if (!result.valid) {
            const errorSummary = result.errors.map(e => e.message).join('; ');
            throw new Error(`Cannot add widget — validation failed: ${errorSummary}`);
        }

        this.applyState(newState);

        const ids = computeInstanceIds(newState);
        const newId = ids[ids.length - 1];
        return `Added ${viewSpecId} widget as "${newId}".`;
    }

    /** Remove a widget by instance ID. */
    private doRemoveWidget(input: Record<string, any>): string {
        const {instanceId} = input;
        if (!instanceId) throw new Error('instanceId is required.');

        const currentState = this.getCurrentStateArray();
        const ids = computeInstanceIds(currentState);
        const idx = ids.indexOf(instanceId);

        if (idx === -1) {
            throw new Error(
                `No widget found with instanceId "${instanceId}". ` +
                    `Current widgets: ${ids.join(', ')}.`
            );
        }

        const newState = [...currentState.slice(0, idx), ...currentState.slice(idx + 1)];

        // Validate (removal can break bindings referencing the removed widget)
        const spec: DashSpec = {version: 1, state: newState};
        const result = validateSpec(spec);
        if (!result.valid) {
            const errorSummary = result.errors.map(e => e.message).join('; ');
            throw new Error(
                `Cannot remove "${instanceId}" — validation failed: ${errorSummary}. ` +
                    'Other widgets may have bindings referencing this widget. ' +
                    'Update or remove those bindings first.'
            );
        }

        this.applyState(newState);
        return `Removed widget "${instanceId}". Dashboard now has ${newState.length} widgets.`;
    }

    /** Update a widget's state (config, bindings) by instance ID. */
    private doUpdateWidget(input: Record<string, any>): string {
        const {instanceId, state: stateChanges, layout: layoutChanges} = input;
        if (!instanceId) throw new Error('instanceId is required.');
        if (!stateChanges && !layoutChanges) {
            throw new Error('At least one of "state" or "layout" must be provided.');
        }

        const currentState = this.getCurrentStateArray();
        const ids = computeInstanceIds(currentState);
        const idx = ids.indexOf(instanceId);

        if (idx === -1) {
            throw new Error(
                `No widget found with instanceId "${instanceId}". ` +
                    `Current widgets: ${ids.join(', ')}.`
            );
        }

        const widget = {...currentState[idx]};

        // Merge state changes (shallow merge, with special handling for bindings)
        if (stateChanges) {
            const existingState = {...(widget.state ?? {})};
            for (const [key, value] of Object.entries(stateChanges)) {
                if (key === 'bindings') {
                    // Merge bindings: new bindings override existing ones by input name
                    existingState.bindings = {
                        ...(existingState.bindings ?? {}),
                        ...(value as Record<string, any>)
                    };
                } else {
                    existingState[key] = value;
                }
            }
            widget.state = existingState;
        }

        // Merge layout changes
        if (layoutChanges) {
            widget.layout = {...widget.layout, ...layoutChanges};
        }

        const newState = [...currentState];
        newState[idx] = widget;

        const spec: DashSpec = {version: 1, state: newState};
        const result = validateSpec(spec);
        if (!result.valid) {
            const errorSummary = result.errors.map(e => e.message).join('; ');
            throw new Error(`Cannot update "${instanceId}" — validation failed: ${errorSummary}`);
        }

        this.applyState(newState);
        return `Updated widget "${instanceId}".`;
    }

    /** Move/resize a widget by instance ID. */
    private doMoveWidget(input: Record<string, any>): string {
        const {instanceId, layout} = input;
        if (!instanceId) throw new Error('instanceId is required.');
        if (!layout) throw new Error('layout is required.');

        // Delegate to update_widget with layout-only changes
        return this.doUpdateWidget({instanceId, layout});
    }

    /** List current widgets with instance IDs, types, layouts, and state. */
    private doListWidgets(): string {
        const currentState = this.getCurrentStateArray();
        const ids = computeInstanceIds(currentState);

        const widgets = currentState.map((widget, idx) => ({
            instanceId: ids[idx],
            viewSpecId: widget.viewSpecId,
            layout: widget.layout,
            state: widget.state ?? {}
        }));

        return JSON.stringify(widgets, null, 2);
    }

    //----------------------------------------------
    // Helpers
    //----------------------------------------------

    /** Get the current dashboard state array from DashCanvasModel. */
    private getCurrentStateArray(): DashWidgetState[] {
        const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
        const persistable = dashModel.getPersistableState();
        return persistable?.value?.state ?? [];
    }

    /** Validate and apply a state array to the dashboard. */
    private applyState(state: DashWidgetState[]) {
        const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
        dashModel.setPersistableState(new PersistableState({state}));
    }

    /** Compute a reasonable auto-placement layout for a new widget. */
    private getAutoLayout(viewSpecId: string): {x: number; y: number; w: number; h: number} {
        const meta = widgetRegistry.get(viewSpecId);
        const w = meta?.defaultSize?.w ?? 6;
        const h = meta?.defaultSize?.h ?? 6;

        // Place at the bottom of the current dashboard
        const currentState = this.getCurrentStateArray();
        let maxY = 0;
        for (const widget of currentState) {
            const bottom = (widget.layout?.y ?? 0) + (widget.layout?.h ?? 0);
            if (bottom > maxY) maxY = bottom;
        }

        return {x: 0, y: maxY, w, h};
    }
}

//--------------------------------------------------
// Tool definitions in Anthropic API format
//--------------------------------------------------
const TOOL_DEFINITIONS: ToolDefinition[] = [
    //----------------------------------------------
    // Dashboard manipulation tools
    //----------------------------------------------
    {
        name: 'set_dashboard',
        description:
            'Replace the entire dashboard with a complete new spec. Use this when creating a ' +
            'dashboard from scratch or making large-scale restructuring changes that affect most ' +
            'widgets. The spec is validated before being applied. For smaller, targeted changes, ' +
            'prefer add_widget, remove_widget, or update_widget.',
        input_schema: {
            type: 'object',
            properties: {
                spec: {
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
                                    layout: {
                                        type: 'object',
                                        properties: {
                                            x: {type: 'number'},
                                            y: {type: 'number'},
                                            w: {type: 'number'},
                                            h: {type: 'number'}
                                        },
                                        required: ['x', 'y', 'w', 'h']
                                    },
                                    state: {type: 'object'}
                                },
                                required: ['viewSpecId', 'layout']
                            }
                        }
                    },
                    required: ['state']
                }
            },
            required: ['spec']
        }
    },
    {
        name: 'add_widget',
        description:
            'Add a single widget to the dashboard. The widget is appended and assigned the ' +
            'next available instance ID for its type. Returns the new instance ID. If layout ' +
            'is omitted, the widget is auto-placed at the bottom of the dashboard.',
        input_schema: {
            type: 'object',
            properties: {
                viewSpecId: {
                    type: 'string',
                    description: 'Widget type to add (e.g. "forecastChart", "cityChooser").'
                },
                layout: {
                    type: 'object',
                    description: 'Grid position and size. Omit to auto-place at the bottom.',
                    properties: {
                        x: {type: 'number', description: 'Column (0-11)'},
                        y: {type: 'number', description: 'Row'},
                        w: {type: 'number', description: 'Width in columns (1-12)'},
                        h: {type: 'number', description: 'Height in rows'}
                    },
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
            required: ['viewSpecId']
        }
    },
    {
        name: 'remove_widget',
        description:
            'Remove a widget from the dashboard by its instance ID. Will fail if other widgets ' +
            'have bindings referencing this widget — update those bindings first.',
        input_schema: {
            type: 'object',
            properties: {
                instanceId: {
                    type: 'string',
                    description: 'Instance ID of the widget to remove (e.g. "forecastChart_0").'
                }
            },
            required: ['instanceId']
        }
    },
    {
        name: 'update_widget',
        description:
            "Update a widget's configuration, bindings, and/or layout. State changes are " +
            'merged with existing state — only the keys you provide are updated. Bindings are ' +
            'also merged by input name. Use this for targeted changes like switching a chart type, ' +
            'changing a binding, or adjusting position.',
        input_schema: {
            type: 'object',
            properties: {
                instanceId: {
                    type: 'string',
                    description: 'Instance ID of the widget to update (e.g. "forecastChart_0").'
                },
                state: {
                    type: 'object',
                    description:
                        'State changes to merge. Include "bindings" to update wiring, or config ' +
                        'keys to change settings. Example: {"chartType": "bar"} or ' +
                        '{"bindings": {"city": {"const": "Tokyo"}}}.'
                },
                layout: {
                    type: 'object',
                    description:
                        'Layout changes to merge. Only include the dimensions you want to change.',
                    properties: {
                        x: {type: 'number'},
                        y: {type: 'number'},
                        w: {type: 'number'},
                        h: {type: 'number'}
                    }
                }
            },
            required: ['instanceId']
        }
    },
    {
        name: 'move_widget',
        description:
            'Move or resize a widget by updating its layout position. Shorthand for ' +
            'update_widget with only layout changes.',
        input_schema: {
            type: 'object',
            properties: {
                instanceId: {
                    type: 'string',
                    description: 'Instance ID of the widget to move (e.g. "forecastChart_0").'
                },
                layout: {
                    type: 'object',
                    description: 'New layout. Include only the dimensions to change.',
                    properties: {
                        x: {type: 'number', description: 'Column (0-11)'},
                        y: {type: 'number', description: 'Row'},
                        w: {type: 'number', description: 'Width in columns (1-12)'},
                        h: {type: 'number', description: 'Height in rows'}
                    }
                }
            },
            required: ['instanceId', 'layout']
        }
    },
    {
        name: 'list_widgets',
        description:
            "Get the current dashboard widget inventory. Returns each widget's instance ID, " +
            'type, layout, and state (including bindings). Use this to inspect the current ' +
            'dashboard before making targeted changes.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },

    //----------------------------------------------
    // App operation tools
    //----------------------------------------------
    {
        name: 'save_dashboard_as_view',
        description:
            'Save the current dashboard layout as a new named view. The current dashboard state will be captured automatically.',
        input_schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name for the saved view (e.g. "Tokyo Overview")'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'switch_to_view',
        description:
            "Switch to an existing saved view by name. The dashboard will update to show that view's layout.",
        input_schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name of the saved view to switch to'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'reset_dashboard',
        description:
            "Reset the dashboard to the current view's last saved state, discarding any unsaved changes.",
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'toggle_theme',
        description: 'Toggle between light and dark theme for the entire application.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'open_widget_chooser',
        description:
            'Open the widget chooser panel so the user can manually browse and add widgets to the dashboard.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'show_json_spec',
        description:
            'Open the JSON spec editor panel so the user can view or manually edit the raw dashboard specification.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'toggle_manual_editing',
        description:
            "Toggle manual editing mode on or off. When enabled, the user can drag, resize, and add widgets directly. Useful for previewing exact layout sizing, and especially helpful whenever a user asks to hide a widget's title bar — enabling manual editing lets them see and adjust the resulting layout.",
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
];
