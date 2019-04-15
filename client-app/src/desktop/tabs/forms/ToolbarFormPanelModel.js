import {HoistModel} from '@xh/hoist/core';
import {FormModel, required} from '@xh/hoist/cmp/form';
import {random} from 'lodash';

@HoistModel
export class ToolbarFormPanelModel {

    topFormModel = new FormModel({
        fields: [
            {name: 'text1', rules: [required]},
            {name: 'number1', initialValue: random(0, 10000000)},
            {name: 'date1'},
            {name: 'buttonGroup1', initialValue: 'button2'},
            {name: 'bool1', rules: [required]},
            {name: 'bool2'}
        ]
    });

    bottomFormModel = new FormModel({
        fields: [
            {name: 'option1', initialValue: 'CA'},
            {name: 'option2'},
            {name: 'option3'}
        ]
    });

}