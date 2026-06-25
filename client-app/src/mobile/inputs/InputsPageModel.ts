import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';

export class InputsPageModel extends HoistModel {
    // Global toggle applied to every input on the page.
    @bindable disabled: boolean = false;

    // Text
    @bindable email: string = 'support@xh.io';
    @bindable password: string = 'somethingSuperS3cret!';
    @bindable notes: string = null;

    // Numbers
    @bindable largeNumber: number = 2_000_000;
    @bindable percent: number = 0.33;

    // Dates
    @bindable boundedDate: LocalDate = null;
    @bindable simpleDate: LocalDate = LocalDate.today();

    // Choices
    @bindable role: string = 'strategy';
    @bindable optionIntent: string = 'danger';
    @bindable chartType: string = 'area';

    // Toggles
    @bindable checkVal: boolean = false;
    @bindable switchVal: boolean = false;
    @bindable buttonVal: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
