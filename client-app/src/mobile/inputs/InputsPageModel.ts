import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';

export class InputsPageModel extends HoistModel {
    // Global toggle applied to every input on the page.
    @bindable accessor disabled: boolean = false;

    // Text
    @bindable accessor email: string = 'support@xh.io';
    @bindable accessor password: string = 'somethingSuperS3cret!';
    @bindable accessor notes: string = null;

    // Numbers
    @bindable accessor largeNumber: number = 2_000_000;
    @bindable accessor percent: number = 0.33;

    // Dates
    @bindable accessor boundedDate: LocalDate = null;
    @bindable accessor simpleDate: LocalDate = LocalDate.today();

    // Choices
    @bindable accessor role: string = 'strategy';
    @bindable accessor optionIntent: string = 'danger';
    @bindable accessor chartType: string = 'area';

    // Toggles
    @bindable accessor checkVal: boolean = false;
    @bindable accessor switchVal: boolean = false;
    @bindable accessor buttonVal: boolean = false;
}
