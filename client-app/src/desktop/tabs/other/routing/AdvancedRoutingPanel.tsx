import {HoistModel, hoistCmp, creates, XH} from '@xh/hoist/core';
import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common';
import React from 'react';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, hframe, span, vbox, vframe} from '@xh/hoist/cmp/layout';
import {colAutosizeButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';

export const advancedRoutingPanel = hoistCmp.factory({
    displayName: 'AdvancedRoutingPanel',
    model: creates(() => new AdvancedRoutingPanelModel()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    This example demonstrates how to use URL route parameters to store and restore
                    the state of a component. The state of the grid (grouping, sorting, and selected
                    record) is stored in the URL, and the state is restored when the URL is
                    revisited.
                </p>,
                <p>
                    The state is encoded in the URL as a <code>base64</code> string, which is then
                    decoded and parsed to restore the state.
                </p>,
                <p>
                    The current state encoding is: <br />
                    <code>{'{'}</code>
                    <br />
                    <code>groupBy: {model.groupBy || 'None'}</code>
                    <br />
                    <code>sortBy: {model.sortBy || 'None'}</code>
                    <br />
                    <code>selectedId: {model.gridModel.selectedRecord?.id || 'None'}</code>
                    <br />
                    <code>{'}'}</code>
                </p>,
                <p></p>
            ],
            item: panel({
                ref: model.panelRef,
                mask: 'onLoad',
                item: hframe(
                    vframe(
                        grid(),
                        hbox({
                            items: [Icon.info()],
                            className: 'tb-sample-grid__selbar'
                        })
                    )
                ),
                tbar: [
                    refreshButton(),
                    colAutosizeButton(),
                    span('Group by:'),
                    select({
                        bind: 'groupBy',
                        options: [
                            {value: 'city', label: 'City'},
                            {value: 'trade_date', label: 'Trade Date'},
                            {value: 'city,trade_date', label: 'City › Trade Date'},
                            {value: null, label: 'None'}
                        ],
                        width: 160
                    }),
                    span('Sort by:'),
                    select({
                        bind: 'sortBy',
                        options: [
                            {value: 'id|desc', label: 'Company ID (Desc)'},
                            {value: 'id|asc', label: 'Company ID (Asc)'},
                            {value: 'company|desc', label: 'Company Name (Desc)'},
                            {value: 'company|asc', label: 'Company Name (Asc)'},
                            {value: 'city|desc', label: 'City (Desc)'},
                            {value: 'city|asc', label: 'City (Asc)'},
                            {value: 'trade_date|desc', label: 'Trade Date (Desc)'},
                            {value: 'trade_date|asc', label: 'Trade Date (Asc)'},
                            {value: null, label: 'None'}
                        ]
                    }),
                    filler(),
                    gridCountLabel({unit: 'companies'}),
                    vbox({})
                ]
            })
        });
    }
});

class AdvancedRoutingPanelModel extends HoistModel {
    @observable groupBy = null;
    @observable sortBy = null;

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => XH.routerState.params,
            run: () => this.parseRouteParams(),
            fireImmediately: true
        });

        this.addReaction({
            track: () => [this.groupBy, this.sortBy, this.gridModel.selectedRecord?.id],
            run: () => this.updateRoute(),
            fireImmediately: true
        });
    }

    gridModel = new GridModel({
        columns: [
            {field: 'id', flex: 0},
            {field: 'company', flex: 1},
            {field: 'city', flex: 1},
            {field: 'trade_date', flex: 1}
        ]
    });

    @action
    private setGroupBy(groupBy: string) {
        this.groupBy = groupBy;

        // Always select first when regrouping.
        const groupByArr = groupBy ? groupBy.split(',') : [];
        this.gridModel.setGroupBy(groupByArr);
    }

    @action
    private setSortBy(sortBy: string) {
        this.sortBy = sortBy;

        // Always select first when resorting.
        const sortByArr = sortBy ? sortBy.split(',') : [];
        this.gridModel.setSortBy(sortByArr);
    }

    @action
    private async setSelected(recordId: string | number) {
        await this.gridModel.selectAsync(Number(recordId));
    }

    @action
    private async parseRouteParams() {
        const advParam = XH.routerState.params.routeParam;
        if (!advParam) return;
        const decodedParam = atob(advParam);
        const {groupBy, sortBy, selectedId} = JSON.parse(decodedParam);
        if (groupBy) this.setGroupBy(groupBy);
        if (sortBy) this.setSortBy(sortBy);
        if (selectedId) await this.setSelected(selectedId);
    }

    @action
    private updateRoute() {
        if (!XH.routerState.name.startsWith('default.other.advancedRouting')) return;
        const {groupBy, sortBy} = this;
        const selectedId = this.gridModel.selectedRecord?.id;
        const routeParam = btoa(JSON.stringify({groupBy, sortBy, selectedId}));
        XH.navigate('default.other.advancedRouting.routeParam', {routeParam});
    }

    override async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.gridModel.loadData(trades);
        await this.parseRouteParams();
    }
}
