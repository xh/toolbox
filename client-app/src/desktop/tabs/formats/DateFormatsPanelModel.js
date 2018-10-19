import React from 'react';
import {clone} from 'lodash';
import moment from 'moment';

import {HoistModel} from '@xh/hoist/core';
import {action, bindable, computed, observable} from '@xh/hoist/mobx';
import * as formatDate from '@xh/hoist/format/FormatDate';

@HoistModel
export class DateFormatsPanelModel {

    @bindable testDates = [
        new Date().getTime(),
        new Date().toString(),
        moment(new Date()).subtract(1, 'days').format(),
        '20101031',
        '2010-10-31',
        '2010/10/31',
        '10/31/2010',
        '31/10/2010',
        '2045-10-31',
        moment(new Date()).subtract(100, 'years').format()
    ];

    @bindable builtinFunction = 'fmtDateTime';
    @observable singleOptionsDisabled = true;

    @bindable fmt = 'YYYY-MM-DD';
    @bindable tooltipSwitch = false;
    tooltipFunc = (d) => `${d}`;
    @bindable dateFromUser = '20150926';

    @computed
    get fOptions() {
        return {
            asElement: true,
            fmt: this.fmt,
            tooltip: this.tooltipSwitch ? this.tooltipFunc : undefined
        };
    }

    @computed
    get formattedDates() {
        const {testDates, builtinFunction} = this,
            rows = testDates.map(
                (testDate, index) =>
                    <tr key={`num-${index}`}>
                        <td className="indexColumn">{index + 1}.</td>
                        <td align="right" className="inputColumn">
                            {testDate}
                        </td>
                        <td align="right">
                            {formatDate[builtinFunction](moment(testDate), this.getFormatOptions())}
                        </td>
                    </tr>
            );

        return rows;
    }

    @computed
    get formattedUserInput() {
        const {dateFromUser, builtinFunction} = this;

        try {
            return formatDate[builtinFunction](moment(dateFromUser), this.getFormatOptions());
        } catch (e) {
            return '';
        }
    }

    //-----------------------------
    // Implementation
    //-----------------------------
    @action
    handleBuiltinFunctionChange(val) {
        this.singleOptionsDisabled = val != 'fmtDate';
    }


    getFormatOptions() {
        const {builtinFunction, fOptions} = this;
        return builtinFunction == 'fmtDate' ?
            clone(fOptions) :
            {
                asElement: true
            };
    }

}