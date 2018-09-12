import {HoistModel} from '@xh/hoist/core';
import {bindable, computed} from '@xh/hoist/mobx';
import {fmtCompact} from "@xh/hoist/format/FormatNumber";
import React from "react";
import {capitalize, toLower} from 'lodash';

@HoistModel
export class FormatsTabModel {

    SCALE_OPTIONS = [
        'None',
        'Auto',
        'Thousands',
        'Millions',
        'Billions'
    ];

    @bindable testNumbers = "123456,\n" +
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
    @bindable decimalTolerance = 2;
    @bindable zeroPad = 0;
    @bindable label = 'Auto';

    @computed get fOptions() {
        return {
            asElement: true,
            label: this.label === 'Default' ? null : toLower(this.label),
            precision: this.precision,
            zeroPad: this.zeroPad,
            decimalTolerance: this.decimalTolerance
        }
    }

    @computed get formattedNumbers() {
        const sampleNumbers = this.testNumbers.split(",").map(v => parseFloat(v.trim()))
        return sampleNumbers.map(
            (num, index) =>
                <tr key={`num-${index}`}>
                    <td>{index + 1}.</td>
                    <td align="right">
                        {sampleNumbers[index]}
                    </td>
                    <td align="right">
                        {fmtCompact(num, this.fOptions)}
                    </td>
                </tr>
        );
    }





}