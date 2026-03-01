import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';
import {AppModel} from '../AppModel';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class DashInspectorModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'dashInspector',
        title: 'Dash Inspector',
        description:
            'Debug utility showing all active widgets, their bindings, and live output values.',
        category: 'utility',
        inputs: [],
        outputs: [],
        config: {},
        defaultSize: {w: 6, h: 8},
        minSize: {w: 4, h: 5}
    };

    @managed gridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.inspectorData,
            run: data => this.gridModel.loadData(data)
        });
    }

    @computed
    get inspectorData(): Record<string, any>[] {
        const dashModel = AppModel.instance.weatherV2DashModel,
            wiringModel = dashModel.wiringModel,
            canvasModel = dashModel.dashCanvasModel,
            allOutputs = wiringModel.allOutputs;

        const state = canvasModel.getPersistableState()?.value?.state ?? [];
        return state.map((item: any, idx: number) => {
            const specId = item.viewSpecId,
                meta = widgetRegistry.get(specId),
                bindings = item.state?.bindings,
                widgetOutputs = allOutputs.get(item.id);

            return {
                id: idx,
                instanceId: item.id ?? specId,
                widgetType: meta?.title ?? specId,
                category: meta?.category ?? '—',
                bindings: bindings ? formatBindings(bindings) : '—',
                outputs: widgetOutputs ? formatOutputs(widgetOutputs) : '—'
            };
        });
    }

    private createGridModel(): GridModel {
        return new GridModel({
            sortBy: 'instanceId',
            emptyText: 'No widgets in dashboard.',
            columns: [
                {field: 'instanceId', headerName: 'Instance', width: 140},
                {field: 'widgetType', headerName: 'Type', width: 120},
                {field: 'category', headerName: 'Category', width: 80},
                {field: 'bindings', headerName: 'Bindings', flex: 1},
                {field: 'outputs', headerName: 'Outputs', flex: 1}
            ]
        });
    }
}

widgetRegistry.register(DashInspectorModel.meta);

//--------------------------------------------------
// Helpers
//--------------------------------------------------
function formatBindings(bindings: Record<string, any>): string {
    return Object.entries(bindings)
        .map(([input, spec]) => {
            if ('const' in spec) return `${input}=${JSON.stringify(spec.const)}`;
            if ('fromWidget' in spec) return `${input}←${spec.fromWidget}.${spec.output}`;
            return `${input}=?`;
        })
        .join(', ');
}

function formatOutputs(outputs: Map<string, any>): string {
    return Array.from(outputs.entries())
        .map(([name, value]) => {
            const display =
                typeof value === 'string' ? value : value != null ? JSON.stringify(value) : 'null';
            return `${name}=${display}`;
        })
        .join(', ');
}

//--------------------------------------------------
// Component
//--------------------------------------------------
export const dashInspectorWidget = hoistCmp.factory({
    displayName: 'DashInspectorWidget',
    model: creates(DashInspectorModel),

    render() {
        return panel({testId: 'dash-inspector', item: grid()});
    }
});
