import {HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {find} from 'lodash';

import {companyTrades} from '../../core/data';

@HoistModel
@LoadSupport
export class GridDetailPageModel {

    id;
    @bindable.ref record;

    constructor({id}) {
        this.id = id;
    }

    async doLoadAsync() {
        const record = find(companyTrades, {id: parseInt(this.id)});
        this.setRecord(record);
    }
}