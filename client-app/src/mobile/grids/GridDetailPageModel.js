import {HoistModel, LoadSupport} from '@xh/hoist/core';
import {observable, settable} from '@xh/hoist/mobx';
import {find} from 'lodash';

import {companyTrades} from '../../core/data';

@HoistModel
@LoadSupport
export class GridDetailPageModel {

    id;
    @settable @observable.ref record;

    constructor({id}) {
        this.id = id;
    }

    async doLoadAsync() {
        const record = find(companyTrades, {id: parseInt(this.id)});
        this.setRecord(record);
    }
}