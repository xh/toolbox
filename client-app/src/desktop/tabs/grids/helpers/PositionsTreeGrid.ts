import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import type {HoistProps, TaskObserver} from '@xh/hoist/core';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import type {ReactNode} from 'react';
import {nameCol} from '../../../../core/columns/General';
import {
    commissionCol,
    costCol,
    dayPnlCol,
    mktValCol,
    pnlCol
} from '../../../../core/columns/Positions';
import {PortfolioService} from '../../../../core/svc/PortfolioService';
import {demoFrame} from '../../../common/Demo';

/** Portfolio dimensions for each level of the tree, outermost first. */
const DIMS = ['fund', 'sector', 'trader'];

/**
 * Tree grid over the mock portfolio, grouped by fund, sector and trader. It starts collapsed, so a
 * find that matches a nested row has to expand the tree to show it. Commission sits in a collapsed
 * Costs column group, for the same reason.
 */
export function createPositionsTreeGridModel(): GridModel {
    return new GridModel({
        treeMode: true,
        selModel: 'single',
        sortBy: 'pnl|desc|abs',
        emptyText: 'No positions.',
        levelLabels: ['Fund', 'Sector', 'Trader'],
        columns: [
            {...nameCol, isTreeColumn: true},
            mktValCol,
            pnlCol,
            dayPnlCol,
            {
                groupId: 'costs',
                headerName: 'Costs',
                collapsed: true,
                children: [costCol, {...commissionCol, groupShowMode: 'expanded'}]
            }
        ]
    });
}

export async function loadPositionsAsync(gridModel: GridModel) {
    const positions = await XH.getService(PortfolioService).getPositionsAsync(DIMS);
    gridModel.loadData(positions);
}

interface PositionsTreeGridFrameProps extends HoistProps {
    gridModel: GridModel;
    label: ReactNode;
    info?: ReactNode;
    mask?: TaskObserver[];
}

/** A fixed-height framed tree grid with a record count, sized to sit inside a demo section. */
export const positionsTreeGridFrame = hoistCmp.factory<PositionsTreeGridFrameProps>(
    ({gridModel, label, info, mask}) =>
        demoFrame({
            label,
            info,
            children: panel({
                height: 320,
                mask,
                children: grid({model: gridModel}),
                bbar: [filler(), gridCountLabel({gridModel, unit: 'position'})]
            })
        })
);
