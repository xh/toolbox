import {div, table, tbody, td, th, tr, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {Icon} from '@xh/hoist/icon/Icon';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),

    render({model}) {
        const {currentRecord} = model;
        if (!currentRecord) return null;

        return vbox({
            className: 'recalls-detail-wrapper',
            alignItems: 'center',
            item: [
                Icon.user({
                    size: '10x'
                }),
                div(`${currentRecord.data.name}`),
                div(`${currentRecord.data.location}`),
                div(`${currentRecord.data.workPhone}`),
                div(`${currentRecord.data.bio}`)
            ]
            //
            //     table(
            //     tbody(
            //         tr(th('Brand Name'), td(`${currentRecord.data.brandName}`)),
            //         tr(th('Generic Name'), td(`${currentRecord.data.genericName}`)),
            //         tr(th('Classification'), td(`${model.classificationDetails}`)),
            //         tr(th('Description'), td(`${currentRecord.data.description}`)),
            //         tr(th('Recalling Firm'), td(`${currentRecord.data.recallingFirm}`)),
            //         tr(th('Reason For Recall'), td(`${currentRecord.data.reason}`))
            //     )
            // )
        });
    }
});
