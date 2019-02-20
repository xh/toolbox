import {HoistModel} from '@xh/hoist/core';
import {observable} from '@xh/hoist/mobx';
import {find} from 'lodash';

import {companyTrades} from '../../core/data';

@HoistModel
export class GridDetailPageModel {

    @observable record;

    constructor({id}) {
        const record = find(companyTrades, {id: parseInt(id)});
        this.record = record;
    }

}