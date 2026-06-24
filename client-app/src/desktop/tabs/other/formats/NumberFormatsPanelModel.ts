import {code} from '@xh/hoist/cmp/layout';
import {HoistModel} from '@xh/hoist/core';
import * as formatFunctions from '@xh/hoist/format/FormatNumber';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {isBoolean} from 'lodash';

export class NumberFormatsPanelModel extends HoistModel {
    testData = [
        Math.PI,
        Math.E,
        1.6180339887, // Golden Mean
        -0.0012, // tests that output is (0.00) with ledger: true, zeroPad: true
        -1842343,
        1.23456e-6,
        1.23456e-7,
        0,
        0.2,
        0.25,
        50,
        101,
        1265, // tests omitFourDigitComma option
        12456.12,
        123400.1,
        123450, // tests that rightmost zero is not cut off when precision: 0 && zeroPad: false
        920120.21343,
        7100000, // fmtQuantity + lossless: collapses to 7.1m (no precision lost)
        7100100, // fmtQuantity + lossless: stays 7,100,100 (would lose precision as 7.10m)
        12345600,
        100000001,
        123456789.12,
        1234567890.12,
        5000000000, // fmtQuantity + lossless: collapses to 5b (no precision lost)
        1.23456e14,
        null,
        undefined
    ];

    @bindable fnName = 'fmtNumber';
    @bindable colorSpec: boolean | 'custom' = true;
    @bindable forceLedgerAlign = true;
    @bindable label: string = null;
    @bindable ledger = false;
    @bindable lossless = false;
    @bindable nullDisplay: string = null;
    @bindable omitFourDigitComma = false;
    @bindable precision = -1; // -1 => 'auto'
    @bindable prefix: string = null;
    @bindable strictZero = true;
    @bindable useMillions = true;
    @bindable useBillions = true;
    @bindable withCommas = true;
    @bindable withPlusSign = false;
    @bindable withSignGlyph = false;
    @bindable zeroDisplay: string = null;
    @bindable zeroPad = -2; // -2 => undefined, -1 => false, 0 => true, # => pad length
    @bindable positiveColor = '#00aa00';
    @bindable negativeColor = '#cc0000';
    @bindable neutralColor = '#999999';

    @bindable tryItData: number = 1234567.89;

    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: nilAwareFormat(data),
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

    //------------------
    // Implementation
    //------------------
    private getResult(input: number) {
        const options = {
            colorSpec: isBoolean(this.colorSpec)
                ? this.colorSpec
                : {
                      pos: {color: this.positiveColor},
                      neg: {color: this.negativeColor},
                      neutral: {color: this.neutralColor}
                  },
            forceLedgerAlign: this.forceLedgerAlign,
            label: this.label ? this.label : undefined,
            ledger: this.ledger,
            nullDisplay: this.nullDisplay != null ? this.nullDisplay : undefined,
            omitFourDigitComma: this.omitFourDigitComma,
            precision: this.toPrecision(this.precision),
            prefix: this.prefix,
            strictZero: this.strictZero,
            withCommas: this.withCommas,
            withPlusSign: this.withPlusSign,
            withSignGlyph: this.withSignGlyph,
            zeroPad: this.toZeroPad(this.zeroPad),
            // fmtQuantity-specific options - ignored by the other functions.
            useMillions: this.useMillions,
            useBillions: this.useBillions,
            lossless: this.lossless
        };

        try {
            return formatFunctions[this.fnName](input, options);
        } catch (e) {
            this.logError(e);
            return '#exception#';
        }
    }

    private toPrecision(formVal: number) {
        return formVal === -1 ? 'auto' : formVal;
    }

    private toZeroPad(formVal: number) {
        switch (formVal) {
            case -2:
                return undefined;
            case -1:
                return false;
            case 0:
                return true;
            default:
                return formVal;
        }
    }
}

function nilAwareFormat(val: any) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return val;
}
