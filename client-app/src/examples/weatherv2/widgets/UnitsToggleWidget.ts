import {hoistCmp, creates} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {WeatherWidgetModel} from '../dash/WeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class UnitsToggleModel extends WeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'unitsToggle',
        title: 'Units Toggle',
        description:
            'Toggle between imperial and metric units. Display widgets that accept a units input will adapt.',
        category: 'input',
        inputs: [],
        outputs: [
            {name: 'units', type: 'string', description: 'Unit system: "imperial" or "metric".'}
        ],
        config: {
            units: {
                type: 'enum',
                description: 'Initial unit system.',
                enum: ['imperial', 'metric'],
                default: 'imperial'
            }
        },
        defaultSize: {w: 3, h: 2},
        minSize: {w: 2, h: 1}
    };

    @bindable units: string = 'imperial';

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.markPersist('units');

        this.addReaction({
            track: () => this.units,
            run: units => this.publishOutput('units', units),
            fireImmediately: true
        });
    }
}

widgetRegistry.register(UnitsToggleModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const unitsToggleWidget = hoistCmp.factory({
    displayName: 'UnitsToggleWidget',
    model: creates(UnitsToggleModel),

    render() {
        return box({
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
            item: buttonGroupInput({
                bind: 'units',
                items: [
                    button({text: '°F / mph', value: 'imperial'}),
                    button({text: '°C / m/s', value: 'metric'})
                ]
            })
        });
    }
});
