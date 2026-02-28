import {hoistCmp, creates} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {box} from '@xh/hoist/cmp/layout';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

export const CITIES = [
    'Atlanta',
    'Austin',
    'Boston',
    'Chicago',
    'Dallas',
    'Denver',
    'Houston',
    'Las Vegas',
    'London',
    'Los Angeles',
    'Miami',
    'Minneapolis',
    'Nashville',
    'New York',
    'Paris',
    'Philadelphia',
    'Phoenix',
    'Portland',
    'San Antonio',
    'San Diego',
    'San Francisco',
    'Seattle',
    'Sydney',
    'Tokyo',
    'Toronto'
];

//--------------------------------------------------
// Model
//--------------------------------------------------
export class CityChooserModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'cityChooser',
        title: 'City Chooser',
        description:
            'Dropdown selector that emits the selected city name. Other widgets bind to this to display data for the chosen city.',
        category: 'input',
        inputs: [],
        outputs: [
            {name: 'selectedCity', type: 'string', description: 'The currently selected city name.'}
        ],
        config: {
            selectedCity: {
                type: 'string',
                description: 'Initially selected city.',
                default: 'New York'
            },
            enableSearch: {
                type: 'boolean',
                description: 'Enable type-ahead filtering in the dropdown.',
                default: true
            }
        },
        defaultSize: {w: 3, h: 2},
        minSize: {w: 2, h: 1}
    };

    @bindable selectedCity: string = 'New York';

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.markPersist('selectedCity');

        // Publish output whenever city changes
        this.addReaction({
            track: () => this.selectedCity,
            run: city => this.publishOutput('selectedCity', city),
            fireImmediately: true
        });
    }

    get cities(): string[] {
        return this.viewModel.viewState?.cities ?? CITIES;
    }

    get enableSearch(): boolean {
        return this.viewModel.viewState?.enableSearch ?? true;
    }
}

widgetRegistry.register(CityChooserModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const cityChooserWidget = hoistCmp.factory({
    displayName: 'CityChooserWidget',
    model: creates(CityChooserModel),

    render({model}) {
        return box({
            testId: 'city-chooser',
            padding: 8,
            flex: 1,
            item: select({
                testId: 'city-select',
                bind: 'selectedCity',
                options: model.cities,
                enableFilter: model.enableSearch,
                width: '100%'
            })
        });
    }
});
