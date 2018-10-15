import React from 'react';
import {clone, toLower} from 'lodash';

import {HoistModel} from '@xh/hoist/core';
import {action, bindable, computed, observable} from '@xh/hoist/mobx';
import * as formatNumber from '@xh/hoist/format/FormatNumber';

@HoistModel
export class FormatsTabModel {

    @bindable testNumbers = `-1842343
0.25
50
101
123456
123450
123400.1
12456.12
12345600
12345000
123456789.12
1234567890.12
123450000
100000001
920120.21343
1.224123
1.23456e-12
123456e14`;

    @bindable presetFunction = 'fmtNumber';
    @observable singleOptionsDisabled = false;

    @bindable precisionAuto = false;
    @bindable precisionNumber = 2;
    @bindable zeroPad = true;
    @bindable ledger = true;
    @bindable forceLedgerAlign = true;
    @bindable withPlusSign = false;
    @bindable withSignGlyph = false;
    @bindable colorSpec = true;
    @bindable label = '';

    @computed
    get fOptions() {
        return {
            asElement: true,
            units: toLower(this.units),
            precision: this.precisionAuto ? 'auto' : this.precisionNumber,
            zeroPad: this.zeroPad,
            ledger: this.ledger,
            forceLedgerAlign: this.forceLedgerAlign,
            withPlusSign: this.withPlusSign,
            withSignGlyph: this.withSignGlyph,
            colorSpec: this.colorSpec,
            label: this.label
        };
    }

    @computed
    get sampleNumbers() {
        return this.testNumbers.trim().split('\n').map(v => parseFloat(v.trim())).filter(v => v);
    }

    @computed
    get formattedNumbers() {
        const {sampleNumbers, presetFunction, fOptions} = this,
            customFormatOptions = presetFunction == 'fmtNumber' ?
                clone(fOptions) :
                {
                    asElement: true
                };

        return sampleNumbers.map(
            (num, index) =>
                <tr key={`num-${index}`}>
                    <td>{index + 1}.</td>
                    <td align="right">
                        {sampleNumbers[index]}
                    </td>
                    <td align="right">
                        {formatNumber[presetFunction](num, customFormatOptions)}
                    </td>
                </tr>
        );
    }

    @computed
    get textAreaRows() {
        return this.testNumbers.split(/(\r\n|\r|\n)/).length;
    }

    //-----------------------------
    // Implementation
    //-----------------------------
    @action
    handlePresetFunctionChange(val) {
        this.singleOptionsDisabled = val != 'fmtNumber';
    }

}