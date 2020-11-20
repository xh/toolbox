import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import * as formatFunctions from '@xh/hoist/format/FormatNumber';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import {nilAwareFormat} from './Util';

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
        12456.12,
        123400.1,
        123450,  // tests that rightmost zero is not cut off  when precision: 0 && zeroPad: false
        920120.21343,
        12345600,
        100000001,
        123456789.12,
        1234567890.12,
        1.23456e14,
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
    @bindable colorSpec = true;
    @bindable nullDisplay = null;
    @bindable label = null;
    
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