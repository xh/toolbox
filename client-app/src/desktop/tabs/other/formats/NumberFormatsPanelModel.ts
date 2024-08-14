import {FormModel} from '@xh/hoist/cmp/form';
import {code} from '@xh/hoist/cmp/layout';
import {HoistModel, managed} from '@xh/hoist/core';
import {NumberFormatOptions} from '@xh/hoist/format/FormatNumber';
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
        12345600,
        100000001,
        123456789.12,
        1234567890.12,
        1.23456e14,
        null,
        undefined
    ];

    @managed formModel: FormModel;
    @bindable tryItData: number;

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

        const optFields: Array<keyof NumberFormatOptions> = [
            'colorSpec',
            'forceLedgerAlign',
            'label',
            'ledger',
            'nullDisplay',
            'omitFourDigitComma',
            'precision',
            'prefix',
            'strictZero',
            'withCommas',
            'withPlusSign',
            'withSignGlyph',
            'zeroDisplay',
            'zeroPad'
        ];

        this.formModel = new FormModel({
            fields: [
                {name: 'fnName', displayName: 'Formatter'},
                ...optFields.map(f => ({name: f, displayName: f})),
                {name: 'positiveColor', displayName: 'colorSpec.pos'},
                {name: 'negativeColor', displayName: 'colorSpec.neg'},
                {name: 'neutralColor', displayName: 'colorSpec.neutral'}
            ],
            initialValues: {
                fnName: 'fmtNumber',
                colorSpec: true,
                forceLedgerAlign: true,
                label: null,
                ledger: false,
                nullDisplay: null,
                omitFourDigitComma: false,
                precision: -1,
                prefix: null,
                strictZero: true,
                withCommas: true,
                withPlusSign: false,
                withSignGlyph: false,
                zeroPad: -2,
                positiveColor: '#00aa00',
                negativeColor: '#cc0000',
                neutralColor: '#999999'
            }
        });
    }

    //------------------
    // Implementation
    //------------------
    private getResult(input: number) {
        const formVals = this.formModel.getData();
        const options = {
            colorSpec: isBoolean(formVals.colorSpec)
                ? formVals.colorSpec
                : {
                      pos: {color: formVals.positiveColor},
                      neg: {color: formVals.negativeColor},
                      neutral: {color: formVals.neutralColor}
                  },
            forceLedgerAlign: formVals.forceLedgerAlign,
            label: formVals.label ? formVals.label : undefined,
            ledger: formVals.ledger,
            nullDisplay: formVals.nullDisplay != null ? formVals.nullDisplay : undefined,
            omitFourDigitComma: formVals.omitFourDigitComma,
            precision: this.toPrecision(formVals.precision),
            prefix: formVals.prefix,
            strictZero: formVals.strictZero,
            withCommas: formVals.withCommas,
            withPlusSign: formVals.withPlusSign,
            withSignGlyph: formVals.withSignGlyph,
            zeroPad: this.toZeroPad(formVals.zeroPad)
        };

        try {
            return formatFunctions[formVals.fnName](input, options);
        } catch (e) {
            this.logError(e);
            return '#exception#';
        }
    }

    private toPrecision(formVal) {
        switch (formVal) {
            case -1:
                return 'auto';
            default:
                return formVal;
        }
    }
    private toZeroPad(formVal) {
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
