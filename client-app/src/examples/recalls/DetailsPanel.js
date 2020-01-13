import {hoistCmp, uses} from '@xh/hoist/core';
import {div, table, tbody, tr, th, td} from '@xh/hoist/cmp/layout';

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
                    tr(th('Brand Name'), td(`${currentRecord.get('brandName')}`)),
                    tr(th('Generic Name'), td(`${currentRecord.get('genericName')}`)),
                    tr(th('Classification'), td(`${model.classificationDetails}`)),
                    tr(th('Description'), td(`${currentRecord.get('description')}`)),
                    tr(th('Recalling Firm'), td(`${currentRecord.get('recallingFirm')}`)),
                    tr(th('Reason For Recall'), td(`${currentRecord.get('reason')}`))
                )
            )
        });
    }
});
