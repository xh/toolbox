import {HoistModel} from '@xh/hoist/core';
import * as formatFunctions from '@xh/hoist/format/FormatDate';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import moment from 'moment';

export class DateFormatsPanelModel extends HoistModel {
    // Recognizable, evocative sample dates paired with a short human label for the input column.
    // Mixes date-only and date-time values (and edge times like midnight / noon) to exercise the
    // different formatting functions, while reading cleanly on the left.
    testData: Array<{date: Date; label: string}> = [
        {date: moment().toDate(), label: 'Today, right now'},
        {date: moment().startOf('day').toDate(), label: 'Today, midnight'},
        {date: moment('2026-01-01 13:00').toDate(), label: "New Year's, 1pm"},
        {date: moment('2026-07-04 00:00').toDate(), label: 'Midnight, July 4th'},
        {date: moment('2024-02-29 12:00').toDate(), label: 'Leap day, noon'},
        {date: moment('2026-03-31 17:00').toDate(), label: 'End of Q1, 5pm'},
        {date: moment('1969-07-20 20:17').toDate(), label: 'Moon landing'},
        {date: moment('1776-07-04').toDate(), label: 'Declaration signed'},
        {date: moment(0).toDate(), label: 'Unix epoch'},
        {date: moment('2099-12-31 23:59').toDate(), label: "Far future, New Year's Eve"},
        {date: null, label: 'Null value'},
        {date: undefined, label: 'Undefined value'}
    ];

    @bindable fnName = 'fmtDate';
    @bindable fmt: string = null;
    @bindable nullDisplay: string = null;
    @bindable tooltip = false;

    @bindable.ref tryItData = new Date();

    get testResults() {
        return this.testData.map(({date, label}) => ({
            data: date,
            formattedData: label,
            result: this.getResult(date)
        }));
    }

    get tryItResult() {
        return this.getResult(this.tryItData);
    }

    get enableFmt() {
        return this.fnName === 'fmtDate';
    }

    constructor() {
        super();
        makeObservable(this);
    }

    //------------------
    // Implementation
    //------------------
    private getResult(input: Date) {
        const options = {
            tooltip: this.tooltip ? d => `${d}` : undefined,
            fmt: this.enableFmt && this.fmt ? this.fmt : undefined,
            nullDisplay: this.nullDisplay != null ? this.nullDisplay : undefined
        };

        try {
            return formatFunctions[this.fnName](input, options);
        } catch (e) {
            this.logError(e);
            return '#exception#';
        }
    }
}
