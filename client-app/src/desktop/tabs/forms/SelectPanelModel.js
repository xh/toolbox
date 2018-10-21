import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field} from '@xh/hoist/field';

@HoistModel
@FieldSupport
export class SelectPanelModel {

    @field() option1
    @field() option1Create
    @field() option1Multi
    @field() option1Obj

    @field() option2
    @field() option2Create
    @field() option2Multi
    @field() option2Obj

    @field() option3
    @field() option3Create
    @field() option3Multi
    @field() option3Obj


    constructor() {
        this.initFields({
            option1: 'CA',
            option2: ['NY', 'CA'],
            option2Multi: true
        });
    }
}