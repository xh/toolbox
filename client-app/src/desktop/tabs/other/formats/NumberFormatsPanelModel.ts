import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import * as formatFunctions from '@xh/hoist/format/FormatNumber';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import {nilAwareFormat} from './Util';
import {isBoolean} from 'lodash';

export class NumberFormatsPanelModel extends HoistModel {
    // Inputs
    testData = [
        Math.PI,
        Math.E,
        1.6180339887, // Golden Mean
        -0.0012, // tests that output is (0.00) with ledger: true, zeroPad: true
        -1842343,
        1.23456e-12,
        0.25,
        50,
        101,
        1265, // tests omitFourDigitComma option
        12456.12,
        123400.1,
        123450, // tests that rightmost zero is not cut off when precision: 0 && zeroPad: false
        920120.21343,
        12345600,
        100000001,
        123456789.12,
        1234567890.12,
        1.23456e14,
        null,
        undefined
    ];
    @bindable tryItData: number;

    // Parameters
    @bindable fnName = 'fmtNumber';
    @bindable precision = 'auto';
    @bindable zeroPad = false;
    @bindable ledger = false;
    @bindable forceLedgerAlign = true;
    @bindable withPlusSign = false;
    @bindable withSignGlyph = false;
    @bindable withCommas = true;
    @bindable omitFourDigitComma = false;
    @bindable colorSpec: boolean | 'custom' = true;
    @bindable nullDisplay = null;
    @bindable label = null;
    @bindable positiveColor = '#00aa00';
    @bindable negativeColor = '#cc0000';
    @bindable neutralColor = '#999999';

    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: nilAwareFormat(data, fmtNumber),
            result: this.getResult(data)
        }));
    }

    get tryItResult() {
        return this.getResult(this.tryItData);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    //-----------------------------
    // Implementation
    //--------------------------------
    private getResult(input: number) {
        const options = {
            precision: this.precision != null ? this.precision : undefined,
            zeroPad: this.zeroPad,
            ledger: this.ledger,
            forceLedgerAlign: this.forceLedgerAlign,
            withPlusSign: this.withPlusSign,
            withSignGlyph: this.withSignGlyph,
            withCommas: this.withCommas,
            omitFourDigitComma: this.omitFourDigitComma,
            colorSpec: isBoolean(this.colorSpec)
                ? this.colorSpec
                : {
                      pos: {color: this.positiveColor},
                      neg: {color: this.negativeColor},
                      neutral: {color: this.neutralColor}
                  },
            label: this.label ? this.label : undefined,
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
