import {HoistModel, XH} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';
import {random} from 'lodash';

export class InputsPanelModel extends HoistModel {
    @bindable commitOnChange = false;

    formModel = new FormModel({
        fields: [
            {
                name: 'textInput1',
                displayName: 'TextInput 1'
            },
            {
                name: 'textInput2',
                displayName: 'TextInput 2'
            },
            {
                name: 'textInput3',
                displayName: 'TextInput 3'
            },
            {
                name: 'textArea',
                displayName: 'TextArea'
            },
            {
                name: 'jsonInput',
                displayName: 'JsonInput'
            },
            {
                name: 'numberInput1',
                displayName: 'NumberInput 1'
            },
            {
                name: 'numberInput2',
                displayName: 'NumberInput 2'
            },
            {
                name: 'numberInput3',
                displayName: 'NumberInput 3'
            },
            {
                name: 'slider1',
                displayName: 'Slider 1',
                initialValue: random(0, 100)
            },
            {
                name: 'slider2',
                displayName: 'Slider 2',
                initialValue: [random(50000, 70000), random(110000, 150000)]
            },
            {
                name: 'dateInput1',
                displayName: 'DateInput 1'
            },
            {
                name: 'dateInput2',
                displayName: 'DateInput 2',
                initialValue: moment().startOf('hour').toDate()
            },
            {
                name: 'dateInput3',
                displayName: 'DateInput 3',
                initialValue: LocalDate.today()
            },
            {
                name: 'select1',
                displayName: 'Select 1'
            },
            {
                name: 'select2',
                displayName: 'Select 2',
                initialValue: 'CA'
            },
            {
                name: 'select3',
                displayName: 'Select 3'
            },
            {
                name: 'select4',
                displayName: 'Select 4'
            },
            {
                name: 'checkbox'
            },
            {
                name: 'switch'
            },
            {
                name: 'buttonGroupInput',
                displayName: 'ButtonGroupInput',
                initialValue: 'button2'
            },
            {
                name: 'radioInput',
                displayName: 'RadioInput'
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query},
            correlationId: true
        });
    }
}
