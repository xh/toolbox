import React from 'react';
import {clone, toLower} from 'lodash';

import {HoistModel} from '@xh/hoist/core';
import {action, bindable, computed, observable} from '@xh/hoist/mobx';
import * as formatNumber from '@xh/hoist/format/FormatNumber';
import {NumberInput, TextInput} from '@xh/hoist/desktop/cmp/form';

@HoistModel
export class FormatsTabModel {

    @bindable testNumbers = [
        '-1842343',
        '1.23456e-12',
        '0.25',
        '1.224123',
        '50',
        '101',
        '12456.12',
        '123400.1',
        '123450',
        '123456',
        '920120.21343',
        '12345600',
        '12345000',
        '100000001',
        '123450000',
        '123456789.12',
        '1234567890.12',
        '1.23456e14'
    ];

    @bindable presetFunction = 'fmtThousands';
    @observable singleOptionsDisabled = true;

    @bindable precisionAuto = false;
    @bindable precisionNumber = 2;
    @computed get precision() {
        return this.precisionAuto ? 'auto' : this.precisionNumber;
    }

    @bindable zeroPad = true;
    @bindable ledger = true;
    @bindable forceLedgerAlign = true;
    @bindable withPlusSign = false;
    @bindable withSignGlyph = false;
    @bindable colorSpec = true;
    @bindable label = '';

    @bindable numberFromUser = '1000';

    @computed
    get fOptions() {
        return {
            asElement: true,
            units: toLower(this.units),
            precision: this.precision,
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
    get formattedNumbers() {
        const {numberFromUser, testNumbers, presetFunction, fOptions} = this,
            customFormatOptions = presetFunction == 'fmtNumber' ?
                clone(fOptions) :
                {
                    asElement: true
                },
            rows = testNumbers.map(
                (num, index) =>
                    <tr key={`num-${index}`}>
                        <td>{index + 1}.</td>
                        <td align="right">
                            {num}
                        </td>
                        <td align="right">
                            {formatNumber[presetFunction](Number(num), customFormatOptions)}
                        </td>
                    </tr>
            );

        rows.push(<tr key={'num-from-user'}>
            <td>{rows.length + 1}.</td>
            <td align="right">
                <TextInput
                    model={this}
                    field="numberFromUser"
                    commitOnChange={true}
                    selectOnFocus={true}
                    width="90%"
                    style={{textAlign: 'right'}}
                />
            </td>
            <td align="right">
                {this.formatUserInput(numberFromUser, presetFunction, customFormatOptions)}
            </td>
        </tr>);

        return rows;
    }

    //-----------------------------
    // Implementation
    //-----------------------------
    @action
    handlePresetFunctionChange(val) {
        this.singleOptionsDisabled = val != 'fmtNumber';
    }

    // handle user typing in scientific notation:
    // for example: 1.89e   - if not caught will cause numbro exception to be thrown
    formatUserInput(val, func, options) {
        try{
            return formatNumber[func](Number(val), options);
        } catch(e) {
            return '';
        }
    }

}