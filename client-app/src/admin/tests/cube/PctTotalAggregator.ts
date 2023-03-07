import {Aggregator} from '@xh/hoist/data';
import {getOrCreate} from '@xh/hoist/utils/js';

export class PctTotalAggregator extends Aggregator {
    override get dependsOnChildrenOnly() {
        return false;
    }

    override aggregate(rows, fieldName, ctx) {
        const {appData, filteredRecords} = ctx,
            tot = getOrCreate(appData, '_pctTotal' + fieldName, () => {
                return filteredRecords.reduce((sum, rec) => sum + rec.data[fieldName] ?? 0, 0);
            });
        let ret = 0;
        this.forEachLeaf(rows, leaf => {
            const val = leaf.data[fieldName];
            if (val != null) ret += val;
        });

        return (ret / tot) * 100;
    }
}
