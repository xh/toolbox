import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {div, filler, hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dateInput, jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import './FeatureRequests.scss';
import {FeatureRequestsModel} from './FeatureRequestsModel';

/** The feature requests users sent through the Architect, with the selected one's details. */
export const featureRequestsPanel = hoistCmp.factory({
    displayName: 'FeatureRequestsPanel',
    model: creates(FeatureRequestsModel),

    render({model}) {
        return panel({
            mask: 'onLoad',
            tbar: [
                dateInput({bind: 'startDay', valueType: 'localDate', width: 120}),
                toolbarSep(),
                dateInput({bind: 'endDay', valueType: 'localDate', width: 120}),
                filler(),
                gridCountLabel({unit: 'request'}),
                refreshButton(),
                exportButton()
            ],
            item: hframe(grid(), detailPanel())
        });
    }
});

const detailPanel = hoistCmp.factory<FeatureRequestsModel>(({model}) => {
    const rec = model.gridModel.selectedRecord;
    return panel({
        title: 'Request',
        icon: Icon.info(),
        compactHeader: true,
        modelConfig: {side: 'right', defaultSize: 420},
        items: rec
            ? [
                  div({className: 'tb-feature-request__words', item: rec.data.userWords}),
                  model.selectedFragment
                      ? jsonInput({
                            value: model.selectedFragment,
                            readonly: true,
                            flex: 1,
                            width: '100%'
                        })
                      : placeholder('No fragment.')
              ]
            : placeholder('Select a request.')
    });
});
