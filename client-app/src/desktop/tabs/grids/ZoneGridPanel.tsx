import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {action, makeObservable, observable} from '@xh/hoist/mobx';
import {filler, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {zoneGrid, ZoneGridModel} from '@xh/hoist/cmp/zoneGrid';
import {select} from '@xh/hoist/desktop/cmp/input';
import {zoneMapperButton} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import React from 'react';
import './ZoneGridPanel.scss';
import {wrapper} from '../../common';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol,
    winLoseCol
} from '../../../core/columns';

export const zoneGridPanel = hoistCmp.factory({
    model: creates(() => ZoneGridPanelModel),
    render() {
        return wrapper({
            className: 'tb-zone-grid-wrapper',
            description: [
                <p>
                    The ZoneGrid component leverages an underlying Grid / GridModel instance to
                    display multi-line full-width rows with configurable fields.
                </p>,
                <p>Typically used to display dense information when horizontal space is limited.</p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ZoneGridPanel.tsx',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/zoneGrid/ZoneGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/zoneGrid/ZoneGridModel.ts',
                    notes: 'Hoist model for configuring and interacting with Zone Grids.'
                },
                {
                    url: '$HR/cmp/zoneGrid/impl/ZoneGridPersistenceModel.ts',
                    notes: 'Hoist model for persisting Zone Grid state.'
                }
            ],
            item: panel({
                title: 'Grids › Zone Grid',
                icon: Icon.gridLarge(),
                className: 'tb-zone-grid-panel',
                width: 500,
                height: 700,
                item: zoneGrid(),
                tbar: [
                    span('Group by:'),
                    select({
                        bind: 'groupBy',
                        options: [
                            {value: 'city', label: 'City'},
                            {value: 'winLose', label: 'Win/Lose'},
                            {value: 'city,winLose', label: 'City › Win/Lose'},
                            {value: 'winLose,city', label: 'Win/Lose › City'},
                            {value: null, label: 'None'}
                        ],
                        width: 160,
                        enableFilter: false
                    }),
                    filler(),
                    zoneMapperButton()
                ]
            })
        });
    }
});

class ZoneGridPanelModel extends HoistModel {
    @observable
    groupBy: string = null;

    @managed
    zoneGridModel: ZoneGridModel = new ZoneGridModel({
        sortBy: 'profit_loss|desc|abs',
        zoneMapperModel: true,
        store: {
            processRawData: r => {
                const pnl = r.profit_loss;
                return {
                    winLose: pnl > 0 ? 'Winner' : pnl < 0 ? 'Loser' : 'Flat',
                    ...r
                };
            }
        },
        levelLabels: () => {
            return this.groupBy === 'city,winLose'
                ? ['City', 'Win/Lose', 'Company']
                : ['Win/Lose', 'City', 'Company'];
        },
        groupSortFn: (a, b, groupField) => {
            if (a === b) return 0;
            if (groupField === 'winLose') {
                return a === 'Winner' ? -1 : 1;
            } else {
                return a < b ? -1 : 1;
            }
        },
        restoreDefaultsFn: () => this.restoreDefaultsFn(),
        columns: [
            companyCol,
            winLoseCol,
            cityCol,
            profitLossCol,
            {...tradeVolumeCol, headerName: 'Vol'},
            tradeDateCol,
            activeCol
        ],
        mappings: {
            tl: 'company',
            tr: 'profit_loss',
            bl: ['city', 'trade_date'],
            br: {field: 'trade_volume', showLabel: true}
        },
        limits: {
            tl: {min: 1, max: 1, only: ['company', 'city']},
            tr: {max: 1},
            bl: {max: 4},
            br: {max: 1}
        }
    });

    constructor() {
        super();
        makeObservable(this);
    }

    override async doLoadAsync() {
        await wait(500);
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.zoneGridModel.loadData(trades);
        await this.zoneGridModel.preSelectFirstAsync();
    }

    @action
    setGroupBy(groupBy: string) {
        this.groupBy = groupBy;

        const groupByArr = groupBy ? groupBy.split(',') : [];
        this.zoneGridModel.setGroupBy(groupByArr);
        this.zoneGridModel.preSelectFirstAsync();
    }

    @action
    private restoreDefaultsFn() {
        this.setGroupBy(null);
    }
}
