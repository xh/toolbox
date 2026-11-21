import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dateInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {LlmSpendModel} from './LlmSpendModel';

/** Tokens used through the Claude API relay on one day, per user and app. */
export const llmSpendPanel = hoistCmp.factory({
    displayName: 'LlmSpendPanel',
    model: creates(LlmSpendModel),

    render({model}) {
        return panel({
            mask: 'onLoad',
            tbar: [
                dateInput({bind: 'day', valueType: 'localDate', width: 120}),
                filler(),
                gridCountLabel({unit: 'row'}),
                refreshButton(),
                exportButton()
            ],
            item: grid()
        });
    }
});
