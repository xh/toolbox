import {HoistModel, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {usStates} from '../../core/data';

export class SelectPageModel extends HoistModel {
    // Global toggle applied to every select on the page.
    @bindable disabled: boolean = false;

    @bindable region: string = 'California';
    @bindable state: string = null;
    @bindable customer: number = null;
    @bindable tag: string = null;

    readonly regionOptions = ['California', 'London', 'Montreal', 'New York'];
    readonly stateOptions = usStates;
    readonly tagOptions = ['Urgent', 'Review', 'Later'];

    constructor() {
        super();
        makeObservable(this);
    }

    async queryCustomersAsync(query: string) {
        const results = await XH.fetchJson({url: 'customer', params: {query}});
        return results.map(it => ({value: it.id, label: it.company}));
    }
}
