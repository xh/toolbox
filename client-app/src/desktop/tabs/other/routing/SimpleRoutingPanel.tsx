import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../../common';

export const simpleRoutingPanel = hoistCmp.factory({
    displayName: 'SimpleRoutingPanel',
    model: creates(() => new SimpleRoutingPanelModel()),

    render({model}) {
        const routedUrl = `${window.location.origin}/app/other/simpleRouting/123`;
        return wrapper({
            description: [
                <p>
                    Hoist provides functionality for route parameters to interact with UI
                    components. The grid below has its selected record synced with a routable URL.
                </p>,
                <p>
                    Given a URL such as <a href={routedUrl}>{routedUrl}</a>, where <code>123</code>{' '}
                    is a record ID, we can auto-select the matching record in the grid. Updates to
                    application state can be pushed back to the URL - try selecting a different
                    record in the grid and observe the URL change.
                </p>,
                <p>
                    Note that this routing relies on an appropriate route path being defined in the
                    config returned by <code>AppModel.getRoutes()</code>.
                </p>
            ],
            item: panel({
                title: 'Simple Routing',
                icon: Icon.gridPanel(),
                item: grid(),
                height: 500,
                width: 700
            })
        });
    }
});

@managed
class SimpleRoutingPanelModel extends HoistModel {
    private readonly BASE_ROUTE = 'default.other.simpleRouting';

    @managed gridModel = new GridModel({
        columns: [{field: 'id'}, {field: 'company', flex: 1}]
    });

    constructor() {
        super();
        this.addReaction(
            {
                // Track lastLoadCompleted to sync route -> grid after initial load.
                track: () => [XH.routerState.params, this.lastLoadCompleted],
                run: () => this.updateGridFromRoute()
            },
            {
                track: () => this.gridModel.selectedId,
                run: () => this.updateRouteFromGrid()
            }
        );
    }

    async updateGridFromRoute() {
        const {gridModel, BASE_ROUTE} = this,
            {name: currRouteName, params} = XH.routerState,
            {recordId} = params;

        // No-op if not on the current base route.
        if (!currRouteName.startsWith(BASE_ROUTE)) return;

        if (recordId) {
            await gridModel.selectAsync(Number(recordId));

            // Check and alert if requested record not found, and clean up route to match.
            if (!gridModel.selectedRecord) {
                XH.dangerToast(`Record ${recordId} not found.`);
                XH.navigate(BASE_ROUTE, {replace: true});
            }
        } else {
            gridModel.clearSelection();
        }
    }

    updateRouteFromGrid() {
        const {gridModel, BASE_ROUTE} = this,
            {name: currRouteName, params} = XH.routerState,
            {selectedId} = gridModel,
            {recordId} = params;

        // No-op if not on the current base route, or if route and selection already match.
        if (!currRouteName.startsWith(BASE_ROUTE) || recordId === selectedId) return;

        if (selectedId) {
            XH.navigate(
                'default.other.simpleRouting.recordId',
                {recordId: selectedId},
                {replace: true} // avoids adding steps to browser history
            );
        } else {
            XH.navigate('default.other.simpleRouting', {replace: true});
        }
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade', loadSpec, correlationId: true});
        this.gridModel.loadData(trades);
    }
}
