import {HoistService} from '@xh/hoist/core';
import {salesFigures} from '../data/';
import {cloneDeep} from 'lodash';

@HoistService
export class SalesService {

    generateSales() {
        const sales = cloneDeep(salesFigures);

        sales.forEach(it => {
            it.salary = Math.round(it.salary / 100) * 100;
            it.retain = (it.actualGross > it.projectedGross) || (it.salary < 90000);
        });
        return sales;
    }

}