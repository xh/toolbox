import moment from 'moment';

import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import * as formatDate from '@xh/hoist/format/FormatDate';

@HoistModel
export class DateFormatsPanelModel {

    testDates = [
        moment().toDate(),
        moment('1776-07-04').toDate(),
        moment('1969-07-20 04:17').toDate(),
        moment(0).toDate(),
        moment('2020-01-20 12:30').toDate()
    ];

    @bindable fnName = 'fmtDate';
    @bindable fmt = 'YYYY-MM-DD';
    @bindable showTooltip = false;

    @bindable tryItDate = new Date();

    get hideOptions() {
        return this.fnName !== 'fmtDate';
    }

    get testResults() {
        return this.testDates.map(it => [it, this.getResult(it)]);
    }

    get tryItResult() {
        return this.getResult(this.tryItDate);
    }

    //-----------------------------
    // Implementation
    //--------------------------------
    getResult(input) {
        const options = !this.hideOptions ? {
            asElement: true,
            fmt: this.fmt,
            tooltip: this.showTooltip ? (d) => `${d}` : undefined
        } : {asElement: true};

        try {
            return formatDate[this.fnName](input, options);
        } catch (e) {
            console.error(e);
        }
    }
}