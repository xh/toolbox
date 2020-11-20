import moment from 'moment';
import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import * as formatFunctions from '@xh/hoist/format/FormatDate';
import {fmtDate} from '@xh/hoist/format';
import {nilAwareFormat} from './Util';

export class DateFormatsPanelModel extends HoistModel {

    // Inputs
    testData = [
        moment().toDate(),
        moment('1776-07-04').toDate(),
        moment('1969-07-20 04:17').toDate(),
        moment(0).toDate(),
        moment('2020-01-20 12:00').toDate(),
        null,
        undefined
    ];
    @bindable tryItData = new Date();

    // Parameters
    @bindable fnName = 'fmtDate';
    @bindable fmt = null;
    @bindable tooltip = false;
    @bindable nullDisplay = null;

    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: nilAwareFormat(data, fmtDate),
            result: this.getResult(data)
        }));
    }

    get tryItResult() {
        return this.getResult(this.tryItData);
    }

    get enableFmt() {
        return this.fnName === 'fmtDate';
    }

    //-----------------------------
    // Implementation
    //--------------------------------
    getResult(input) {
        const options = {
            asElement: true,
            tooltip: this.tooltip ? (d) => `${d}` : undefined,
            fmt: this.enableFmt && this.fmt ? this.fmt : undefined,
            nullDisplay: this.nullDisplay != null ? this.nullDisplay : undefined
        };

        try {
            return formatFunctions[this.fnName](input, options);
        } catch (e) {
            console.error(e);
            return '#exception#';
        }
    }
}