import {hoistCmp, creates} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {settingsAwarePanel} from './settingsAwarePanel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class UnitsToggleModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'unitsToggle',
        title: 'Units Toggle',
        description:
            'Toggle between imperial and metric units. Display widgets that accept a units input will adapt.',
        category: 'input',
        inputs: [],
        outputs: [
            {name: 'units', type: 'units', description: 'Unit system: "imperial" or "metric".'}
        ],
        config: {},
        defaultSize: {w: 3, h: 3},
        idealSize: {h: 3},
        minSize: {w: 2, h: 3}
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

    render({model}) {
        const content = box({
            testId: 'units-toggle',
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            item: buttonGroupInput({
                testId: 'units-input',
                bind: 'units',
                intent: 'primary',
                outlined: true,
                width: '100%',
                maxWidth: 300,
                items: [
                    button({text: '°F / mph', value: 'imperial', flex: 1}),
                    button({text: '°C / m/s', value: 'metric', flex: 1})
                ]
            })
        });
        return settingsAwarePanel(model, content);
    }
});
