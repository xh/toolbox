import {hoistCmp, creates} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {box} from '@xh/hoist/cmp/layout';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {settingsAwarePanel} from './settingsAwarePanel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

/**
 * Curated list of major cities known to work well with the OpenWeatherMap API.
 * Shown as structured suggestions in the dropdown, but users and the LLM can
 * also enter any city name — the weather API accepts any valid city worldwide.
 */
export const CITIES = [
    'Atlanta',
    'Austin',
    'Bangkok',
    'Berlin',
    'Boston',
    'Buenos Aires',
    'Cairo',
    'Chicago',
    'Dallas',
    'Denver',
    'Dubai',
    'Houston',
    'Hong Kong',
    'Istanbul',
    'Las Vegas',
    'London',
    'Los Angeles',
    'Madrid',
    'Mexico City',
    'Miami',
    'Minneapolis',
    'Mumbai',
    'Nashville',
    'New York',
    'Paris',
    'Philadelphia',
    'Phoenix',
    'Portland',
    'Rome',
    'San Antonio',
    'San Diego',
    'San Francisco',
    'Seattle',
    'Seoul',
    'Shanghai',
    'Singapore',
    'Sydney',
    'Tokyo',
    'Toronto',
    'Vancouver'
];

//--------------------------------------------------
// Model
//--------------------------------------------------
export class CityChooserModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'cityChooser',
        title: 'City Chooser',
        description:
            'Dropdown selector that emits the selected city name. Includes a curated list of major cities but also accepts any city name supported by the weather API.',
        category: 'input',
        inputs: [],
        outputs: [
            {name: 'selectedCity', type: 'city', description: 'The currently selected city name.'}
        ],
        config: {
            selectedCity: {
                type: 'string',
                description:
                    'Initially selected city. Can be any city name the weather API supports.',
                default: 'New York'
            },
            enableSearch: {
                type: 'boolean',
                description: 'Enable type-ahead filtering in the dropdown.',
                default: true
            }
        },
        defaultSize: {w: 3, h: 3},
        idealSize: {h: 3},
        minSize: {w: 2, h: 3}
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
        const content = box({
            testId: 'city-chooser',
            padding: 8,
            flex: 1,
            item: select({
                testId: 'city-select',
                bind: 'selectedCity',
                options: model.cities,
                enableFilter: model.enableSearch,
                enableCreate: true,
                createMessageFn: q => `Use "${q}"`,
                width: '100%'
            })
        });
        return settingsAwarePanel(model, content);
    }
});
