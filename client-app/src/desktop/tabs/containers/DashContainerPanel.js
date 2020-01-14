import React from 'react';
import {XH, creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {RenderMode, RefreshMode} from '@xh/hoist/enums';

import {SimplePanel, ButtonGroupPanel, ButtonGroupPanelModel, SimpleChartPanel} from './impl/DashViews';
import {wrapper, sampleGrid, SampleGridModel, sampleTreeGrid} from '../../common';

export const DashContainerPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashContainer</code> is configured and managed via a <code>DashContainerModel</code>
                    and support publishing observable state, managed mounting/unmounting of inactive tabs,
                    and lazy refreshing of its active Tab.
                </p>
            ],
            item: panel({
                title: 'Containers › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: dashContainer(),
                bbar: [
                    button({
                        text: 'Reset & Clear State',
                        onClick: () => model.resetState()
                    }),
                    filler(),
                    button({
                        text: 'Capture State',
                        icon: Icon.camera(),
                        onClick: () => model.saveState()
                    }),
                    button({
                        disabled: !model.stateSnapshot,
                        text: 'Load Saved State',
                        icon: Icon.upload(),
                        onClick: () => model.loadState()
                    })
                ]
            })
        });
    }
});

@HoistModel
class Model {

    stateKey = 'dashContainerState';

    @bindable.ref stateSnapshot;

    defaultState = [{
        type: 'row',
        content: [
            {
                type: 'stack',
                content: [
                    {type: 'view', id: 'grid'},
                    {type: 'view', id: 'treeGrid'}
                ]
            },
            {
                type: 'column',
                content: [
                    {type: 'view', id: 'chart'},
                    {type: 'view', id: 'buttonGroupPanel'}
                ]
            }
        ]
    }];

    @managed
    dashContainerModel = new DashContainerModel({
        initialState: XH.localStorageService.get(this.stateKey, this.defaultState),
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                allowClose: false,
                content: () => sampleGrid({omitGridTools: true}),
                contentModelFn: () => new SampleGridModel(),
                getState: (model) => {
                    const {columnState, sortBy, groupBy} = model.gridModel;
                    return {columnState, sortBy, groupBy};
                },
                setState: (state, model) => {
                    const {columnState, sortBy, groupBy} = state,
                        {gridModel} = model;

                    gridModel.applyColumnStateChanges(columnState);
                    gridModel.setSortBy(sortBy);
                    gridModel.setGroupBy(groupBy);
                }
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                icon: Icon.grid(),
                content: () => sampleTreeGrid({model: {includeCheckboxes: false}})
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: RefreshMode.ON_SHOW_ALWAYS,
                content: SimpleChartPanel
            },
            {
                id: 'buttonGroupPanel',
                title: 'Button Group',
                icon: Icon.question(),
                content: ButtonGroupPanel,
                contentModelFn: () => new ButtonGroupPanelModel(),
                getState: (model) => model.getState(),
                setState: (state, model) => model.setState(state)
            },
            {
                id: 'simple',
                title: 'Simple Panel',
                renderMode: RenderMode.ALWAYS,
                content: SimplePanel
            }
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.dashContainerModel.state,
            run: (state) => XH.localStorageService.set(this.stateKey, state)
        });
    }

    saveState() {
        this.setStateSnapshot(this.dashContainerModel.state);
        XH.toast({message: 'Dash state snapshot captured!'});
    }

    loadState() {
        this.dashContainerModel.loadStateAsync(this.stateSnapshot).then(() => {
            XH.toast({message: 'Dash state snapshot loaded!'});
        });
    }

    resetState() {
        XH.localStorageService.remove(this.stateKey);
        this.dashContainerModel.loadStateAsync(this.defaultState).then(() => {
            XH.toast({message: 'Dash state reset to default'});
        });
    }
}
