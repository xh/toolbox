import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {find} from 'lodash';

@HoistModel
@LoadSupport
export class GridDetailPageModel {

    id;
    @bindable.ref record;

    constructor({id}) {
        this.id = id;
    }

    async doLoadAsync() {
        const companyTrades = await XH.fetchJson({url: 'customer'});
        const record = find(companyTrades, {id: parseInt(this.id)});
        this.setRecord(record);
    }
}