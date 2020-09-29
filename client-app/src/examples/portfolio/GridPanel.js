import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';

import {GridPanelModel} from './GridPanelModel';

export const gridPanel = hoistCmp.factory({
    model: uses(GridPanelModel),

    render({model}) {
        const {panelSizingModel} = model;

        return panel({
            item: grid({agOptions: {groupDefaultExpanded: 1}}),
            model: panelSizingModel,
            bbar: [
                dimensionChooser(),
                gridCountLabel({unit: 'position'}),
                select({
                    label: 'Tree Grid Style Mode',
                    bind: 'treeGridStyleMode',
                    options: [
                        {value: 'none', label: 'None'},
                        {value: 'gradient', label: 'Gradient'},
                        {value: 'top-two-levels', label: 'Top Two Levels'},
                        {value: 'tricolor', label: 'Tricolor'}
                    ]
                }),
                filler(),
                relativeTimestamp({bind: 'loadTimestamp'}),
                refreshButton({model: XH.refreshContextModel, intent: 'success'})
            ]
        });
    }
});