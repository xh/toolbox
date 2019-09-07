import {hoistCmpFactory} from '@xh/hoist/core';
import {div, table, tbody, tr, th, td} from '@xh/hoist/cmp/layout';

export const detailsPanel = hoistCmpFactory(
    ({model}) => {
        const {currentRecord} = model;

        if (!currentRecord) return null;

        return div({
            className: 'recalls-detail-wrapper',
            item: table(
                tbody(
                    tr(th('Brand Name'), td(`${currentRecord.brandName}`)),
                    tr(th('Generic Name'), td(`${currentRecord.genericName}`)),
                    tr(th('Classification'), td(`${model.classificationDetails}`)),
                    tr(th('Description'), td(`${currentRecord.description}`)),
                    tr(th('Recalling Firm'), td(`${currentRecord.recallingFirm}`)),
                    tr(th('Reason For Recall'), td(`${currentRecord.reason}`))
                )
            )
        });
    }
);