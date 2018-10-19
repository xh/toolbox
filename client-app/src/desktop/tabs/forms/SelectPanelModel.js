import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field} from '@xh/hoist/field';

@HoistModel
@FieldSupport
export class SelectPanelModel {

    @field() option1
    @field() option1Obj
    @field() option1Multi

    @field() option2
    @field() option2Obj
    @field() option2Multi

    @field() option3
    @field() option3Obj
    @field() option3Multi


    constructor() {
        this.initFields({
            option1: 'CA',
            option2: ['NY', 'CA'],
            option2Multi: true
        });
    }
}