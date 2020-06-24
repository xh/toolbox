import {hoistCmp, uses} from '@xh/hoist/core';
import {table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {DetailsTableModel} from './DetailsTableModel';

export const detailsTable = hoistCmp.factory({
    model: uses(DetailsTableModel),

    render({model}) {
        const {currentRecord} = model;

        if (!currentRecord) return null;

        return table(
            tbody(
                tr(th('Brand Name'), td(`${currentRecord.data.brandName}`)),
                tr(th('Generic Name'), td(`${currentRecord.data.genericName}`)),
                tr(th('Classification'), td(`${model.classificationDetails}`)),
                tr(th('Description'), td(`${currentRecord.data.description}`)),
                tr(th('Recalling Firm'), td(`${currentRecord.data.recallingFirm}`)),
                tr(th('Reason For Recall'), td(`${currentRecord.data.reason}`))
            )
        );
    }
});
