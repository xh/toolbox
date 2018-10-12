import {HoistModel} from '@xh/hoist/core';
import {bindable, computed} from '@xh/hoist/mobx';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import React from 'react';
import {toLower} from 'lodash';

@HoistModel
export class FormatsTabModel {

    @bindable testNumbers = '123456\n123450\n123400.1\n12456.12\n12345600\n12345000\n123456789.12\n' +
                            '123450000\n100000001\n0.25\n101\n920120.21343\n1.224123\n0.123456e-12\n123456e14';

    @bindable precisionAuto = false;
    @bindable precisionNumber = 2;
    @bindable zeroPad = true;

    @computed
    get fOptions() {
        return {
            asElement: true,
            units: toLower(this.units),
            precision: this.precisionAuto ? 'auto' : this.precisionNumber,
            zeroPad: this.zeroPad
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
        return this.testNumbers.split(/(\r\n|\r|\n)/).length;
    }

}