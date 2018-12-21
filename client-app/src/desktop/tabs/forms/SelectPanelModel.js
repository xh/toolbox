import {HoistModel} from '@xh/hoist/core';
import {FormSupport, field} from '@xh/hoist/field';

@HoistModel
@FormSupport
export class SelectPanelModel {

    @field() option1
    @field() option1Create
    @field() option1Multi

    @field() option2
    @field() option2Create
    @field() option2Multi

    @field() option3
    @field() option3Create
    @field() option3Multi

    constructor() {
        this.initFields({
            option1: 'CA',
            option2: ['NY', 'CA'],
            option2Multi: true
        });
    }
}