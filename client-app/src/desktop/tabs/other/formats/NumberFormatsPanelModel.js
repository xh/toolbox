import BigNumber from 'bignumber.js';
import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import * as formatFunctions from '@xh/hoist/format/FormatNumber';
import {typeAwareNumberWriter} from './Util';

export class NumberFormatsPanelModel extends HoistModel {

    // Inputs
    testData = [
        Math.PI,
        Math.E,
        1.6180339887,   // Golden Mean
        -0.0012, // tests that output is (0.00) with ledger: true, zeroPad: true
        -1842343,
        1.23456e-12,
        0.25,
        50,
        101,
        1265, // tests omitFourDigitComma option
        12456.12,
        123400.1,
        123450,  // tests that rightmost zero is not cut off when precision: 0 && zeroPad: false
        920120.21343,
        12345600,
        100000001,
        123456789.12,
        1234567890.12,
        1.23456e14,
        123456789012345.1,  // exceeds # of significant digits that JS can handle. Vanilla JS .toFixed(6) produces incorrect result: '123456789012345.093750'
        '9007199254740999', // exceeds Number.MAX_SAFE_INTEGER by 8 (must be passed in as a string or else JS will round it before it is passed in)
        BigNumber('8589934592.123456'),  // 8589934592.123456 exceeds the number of safe decimal places JS tolerates.  (8589934592.123456 has value 8589934592.123455 in JS console)
        null,
        undefined
    ];
    @bindable tryItData;

    // Parameters
    @bindable fnName = 'fmtNumber';
    @bindable precision= 'auto';
    @bindable zeroPad = false;
    @bindable ledger = false;
    @bindable forceLedgerAlign = true;
    @bindable withPlusSign = false;
    @bindable withSignGlyph = false;
    @bindable withCommas = true;
    @bindable omitFourDigitComma = false;
    @bindable colorSpec = true;
    @bindable nullDisplay = null;
    @bindable label = null;
    
    get testResults() {
        return this.testData.map(data => ({
            data,
            formattedData: typeAwareNumberWriter(data),
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
    getResult(input) {
        const options = {
            asElement: true,
            precision: this.precision != null ? this.precision : undefined,
            zeroPad: this.zeroPad,
            ledger: this.ledger,
            forceLedgerAlign: this.forceLedgerAlign,
            withPlusSign: this.withPlusSign,
            withSignGlyph: this.withSignGlyph,
            withCommas: this.withCommas,
            omitFourDigitComma: this.omitFourDigitComma,
            colorSpec: this.colorSpec,
            label: this.label ? this.label : undefined,
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