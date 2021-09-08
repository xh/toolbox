import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {castArray} from 'lodash';

export class LoadTimesModel extends HoistModel {

    @managed gridModel = new GridModel({
        store: {idSpec: 'timestamp'},
        sortBy: 'timestamp|desc',
        emptyText: 'No actions recorded...',
        hideHeaders: true,
        columns: [
            {field: 'timestamp', hidden: true},
            {field: 'tag', flex: 1},
            {
                field: 'took',
                width: 80,
                align: 'right',
                renderer: numberRenderer({precision: 0, label: 'ms'})
            }
        ]
    });

    clearLoadTimes() {
        this.gridModel.loadData([]);
    }

    async withLoadTime(tag, fn) {
        const start = Date.now();
        await fn();
        const end = Date.now();

        this.addLoadTimes([{
            timestamp: end,
            took: end - start,
            tag
        }]);
    }

    addLoadTimes(times) {
        this.gridModel.updateData({add: castArray(times)});
    }
}
