import type {GridConfig} from '@xh/hoist/cmp/grid';
import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import type {HoistProps, TaskObserver} from '@xh/hoist/core';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import type {ReactNode} from 'react';
import {activeCol} from '../../../../core/columns/General';
import {cityCol, companyCol} from '../../../../core/columns/Demographics';
import {
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol,
    winLoseCol
} from '../../../../core/columns/Trades';
import {demoFrame} from '../../../common/Demo';

/**
 * Grid over the mock trades endpoint, shared by the Grid Helpers pages so each can focus on the
 * control it demos. Records carry a derived `winLose` field for grouping.
 */
export function createTradesGridModel(config: Partial<GridConfig> = {}): GridModel {
    return new GridModel({
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No matching trades.',
        store: {
            processRawData: r => {
                const pnl = r.profit_loss;
                return {winLose: pnl > 0 ? 'Winner' : pnl < 0 ? 'Loser' : 'Flat', ...r};
            }
        },
        columns: [
            {field: 'id', hidden: true},
            activeCol,
            companyCol,
            cityCol,
            winLoseCol,
            tradeVolumeCol,
            profitLossCol,
            tradeDateCol
        ],
        ...config
    });
}

export async function loadTradesAsync(gridModel: GridModel) {
    const {trades} = await XH.fetchJson({url: 'trade'});
    gridModel.loadData(trades);
}

interface TradesGridFrameProps extends HoistProps {
    gridModel: GridModel;
    label: ReactNode;
    info?: ReactNode;
    mask?: TaskObserver[];
}

/** A fixed-height framed grid with a record count, sized to sit inside a demo section. */
export const tradesGridFrame = hoistCmp.factory<TradesGridFrameProps>(
    ({gridModel, label, info, mask}) =>
        demoFrame({
            label,
            info,
            item: panel({
                height: 320,
                mask,
                item: grid({model: gridModel}),
                bbar: [filler(), gridCountLabel({gridModel, unit: 'trade'})]
            })
        })
);
