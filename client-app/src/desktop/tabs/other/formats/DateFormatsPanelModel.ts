import {FormModel} from '@xh/hoist/cmp/form';
import {code} from '@xh/hoist/cmp/layout';
import {HoistModel, managed} from '@xh/hoist/core';
import {DateFormatOptions} from '@xh/hoist/format';
import * as formatFunctions from '@xh/hoist/format/FormatDate';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import moment from 'moment';

export class DateFormatsPanelModel extends HoistModel {
    testData = [
        moment().toDate(),
        moment().add(-3, 'days').toDate(),
        moment().add(-3, 'months').toDate(),
        moment('2020-01-20 12:00').toDate(),
        moment(0).toDate(),
        moment('1969-07-20 04:17').toDate(),
        moment('1776-07-04').toDate(),
        null,
        undefined
    ];

    @managed formModel: FormModel;
    @bindable.ref tryItData = new Date();

    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: nilAwareFormat(data?.toString() ?? data),
            result: this.getResult(data)
        }));
    }

    get tryItResult() {
        return this.getResult(this.tryItData);
    }

    get enableFmt() {
        return this.formModel.values.fnName === 'fmtDate';
    }

    constructor() {
        super();
        makeObservable(this);

        const optFields: Array<keyof DateFormatOptions> = ['fmt', 'nullDisplay', 'tooltip'];

        this.formModel = new FormModel({
            fields: [
                {name: 'fnName', displayName: 'Formatter'},
                ...optFields.map(f => ({name: f, displayName: f}))
            ],
            initialValues: {
                fnName: 'fmtDate',
                fmt: null,
                tooltip: false,
                nullDisplay: null
            }
        });
    }

    //------------------
    // Implementation
    //------------------
    private getResult(input: Date) {
        const formVals = this.formModel.getData(),
            options = {
                tooltip: formVals.tooltip ? d => `${d}` : undefined,
                fmt: this.enableFmt && formVals.fmt ? formVals.fmt : undefined,
                nullDisplay: formVals.nullDisplay != null ? formVals.nullDisplay : undefined
            };

        try {
            return formatFunctions[formVals.fnName](input, options);
        } catch (e) {
            this.logError(e);
            return '#exception#';
        }
    }
}

function nilAwareFormat(val: any) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return val;
}
