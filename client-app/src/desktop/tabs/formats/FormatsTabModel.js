import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel()
export class FormatsTabModel {
    @bindable testnumbers = "123456,\n" +
                            "123450,\n" +
                            "123400.1,\n" +
                            "12456.12,\n" +
                            "12345600,\n" +
                            "12345000,\n" +
                            "123456789.12,\n" +
                            "123450000,\n" +
                            "100000001,\n" +
                            "0.25,\n" +
                            "8,\n" +
                            "101,\n" +
                            "920120.21343,\n" +
                            "1.224123";

    @bindable precision = 2;
    @bindable decimaltolerance = 2;
    @bindable zeropad = 0;

    @bindable label = 'Default';

}