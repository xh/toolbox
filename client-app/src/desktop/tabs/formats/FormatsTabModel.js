import {HoistModel} from '@xh/hoist/core';
import {bindable, computed} from '@xh/hoist/mobx';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import React from 'react';
import {toLower} from 'lodash';

@HoistModel
export class FormatsTabModel {

    UNIT_OPTIONS = [
        'None',
        'Auto',
        'Thousands',
        'Millions',
        'Billions'
    ];

    @bindable testNumbers = '123456\n123450\n123400.1\n12456.12\n12345600\n12345000\n123456789.12\n' +
                            '123450000\n100000001\n0.25\n101\n920120.21343\n1.224123';

    @bindable precision = 2;
    @bindable decimalTolerance = 2;
    @bindable zeroPad = 0;
    @bindable units = 'Auto';

    @computed
    get fOptions() {
        return {
            asElement: true,
            units: toLower(this.units),
            precision: this.precision,
            zeroPad: this.zeroPad,
            decimalTolerance: this.decimalTolerance
        };
    }

    @computed
    get sampleNumbers() {
        return this.testNumbers.trim().split('\n').map(v => parseFloat(v.trim())).filter(v => v);
    }

    @computed
    get formattedNumbers() {
        const sampleNumbers = this.sampleNumbers;
        return sampleNumbers.map(
            (num, index) =>
                <tr key={`num-${index}`}>
                    <td>{index + 1}.</td>
                    <td align="right">
                        {sampleNumbers[index]}
                    </td>
                    <td align="right">
                        {fmtNumber(num, this.fOptions)}
                    </td>
                </tr>
        );
    }

    @computed
    get textAreaRows() {
        return this.testNumbers.split(/\r\n|\r|\n/).length
    }

}