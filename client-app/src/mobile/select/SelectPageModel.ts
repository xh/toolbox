import {HoistModel, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {usStates} from '../../core/data';

export class SelectPageModel extends HoistModel {
    // Global toggle applied to every select on the page.
    @bindable accessor disabled: boolean = false;

    @bindable accessor region: string = 'California';
    @bindable accessor state: string = null;
    @bindable accessor customer: number = null;
    @bindable accessor tag: string = null;

    readonly regionOptions = ['California', 'London', 'Montreal', 'New York'];
    readonly stateOptions = usStates;
    readonly tagOptions = ['Urgent', 'Review', 'Later'];

    async queryCustomersAsync(query: string) {
        const results = await XH.fetchJson({url: 'customer', params: {query}});
        return results.map(it => ({value: it.id, label: it.company}));
    }
}
