import {HoistModel, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class SelectTestModel {
    @bindable
    selectValue;
    @bindable
    creatableValue;
    @bindable
    asyncValue;
    @bindable
    asyncCreatableValue;
    @bindable
    groupedValue;
    @bindable
    bigValue;
    @bindable
    numOptions = 1000;
    @bindable
    bigOptions;

    constructor() {
        this.addReaction({
            track: () => this.numOptions,
            run: () => {
                let options = [];
                for (let i = 0; i < this.numOptions; i++) {
                    options.push(i);
                }
                this.setBigOptions(options);
            },
            fireImmediately: true
        });
    }

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }
}