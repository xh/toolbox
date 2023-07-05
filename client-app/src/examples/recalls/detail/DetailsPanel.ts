import {div, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),

    render({model}) {
        const {currentRecord} = model;
        if (!currentRecord) return null;

        return div({
            className: 'recalls-detail-wrapper',
            item: table(
                tbody(
                    tr(th('Brand Name'), td(`${currentRecord.data.brandName}`)),
                    tr(th('Generic Name'), td(`${currentRecord.data.genericName}`)),
                    tr(th('Classification'), td(`${model.classificationDetails}`)),
                    tr(th('Description'), td(`${currentRecord.data.description}`)),
                    tr(th('Recalling Firm'), td(`${currentRecord.data.recallingFirm}`)),
                    tr(th('Reason For Recall'), td(`${currentRecord.data.reason}`))
                )
            )
        });
    }
});
