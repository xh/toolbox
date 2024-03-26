import {HoistModel, hoistCmp, creates, XH, managed} from '@xh/hoist/core';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {StoreRecordId} from '@xh/hoist/data';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common';
import React from 'react';

export const simpleRoutingPanel = hoistCmp.factory({
    displayName: 'SimpleRoutingPanel',
    model: creates(() => new SimpleRoutingPanelModel()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Hoist provides functionality for route parameters to interact with UI
                    components. Below is a simple grid whose selected record can be maintained by a
                    route parameter.
                </p>,
                <p>
                    E.g. URLs like <code>https://toolbox.xh.io/app/other/simpleRouting/123</code>,
                    where <code>123</code> is a record ID and that record is (auto) selected in the
                    grid. Additionally, the route parameter will be updated when the user selects a
                    different record in the grid. You can view the route definition in{' '}
                    <code>toolbox/client-app/src/desktop/AppModel.ts</code>
                </p>
            ],
            item: panel({
                title: 'Simple Routing',
                icon: Icon.gridPanel(),
                className: 'tb-simple-routing-panel',
                item: grid({model: model.gridModel}),
                height: 600,
                width: 600
            })
        });
    }
});

@managed
class SimpleRoutingPanelModel extends HoistModel {
    gridModel = new GridModel({
        columns: [
            {field: 'id', flex: 0},
            {field: 'company', flex: 1}
        ]
    });

    constructor() {
        super();
        this.addReaction(
            {
                track: () => XH.routerState.params,
                run: () => this.updateGridSelectionOnRouteChange()
            },
            {
                track: () => this.gridModel.selectedId,
                run: () =>
                    this.updateRouteOnGridSelectionChange(
                        XH.routerState.name,
                        this.gridModel.selectedId
                    )
            }
        );
    }

    async updateGridSelectionOnRouteChange() {
        if (!XH.routerState.params.recordId || this.gridModel.empty) {
            this.gridModel.clearSelection();
            return;
        }
        await this.gridModel.selectAsync(Number(XH.routerState.params.recordId));
        if (!this.gridModel.selectedRecord) {
            XH.dangerToast(`Record ${XH.routerState.params.recordId} not found`);
            XH.navigate('default.other.simpleRouting', {replace: true});
        }
    }

    updateRouteOnGridSelectionChange(name: string, selectedId: StoreRecordId) {
        if (
            !name.startsWith('default.other.simpleRouting') ||
            XH.routerState.params.recordId === selectedId ||
            this.gridModel.empty
        )
            return;
        if (!selectedId) XH.navigate('default.other.simpleRouting', {replace: true});
        else
            XH.navigate(
                'default.other.simpleRouting.recordId',
                {recordId: selectedId},
                {replace: true}
            );
    }

    override async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.gridModel.loadData(trades);
        await this.updateGridSelectionOnRouteChange();
    }
}
