import React from 'react';
import {XH, creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {DashRenderMode, DashRefreshMode} from '@xh/hoist/enums';

import {SimplePanel, ButtonGroupPanel, ButtonGroupPanelModel, SimpleChartPanel} from './impl/DashViews';
import {wrapper, sampleGrid, sampleTreeGrid} from '../../common';

export const DashContainerPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: <p>
                Todo
            </p>,
            item: panel({
                title: 'Containers › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: dashContainer({model: model.dashContainerModel}),
                bbar: [
                    button({
                        text: 'Reset & Clear State',
                        onClick: () => model.resetState()
                    }),
                    filler(),
                    button({
                        text: 'Capture State',
                        icon: Icon.save(),
                        onClick: () => model.saveState()
                    }),
                    button({
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

    @managed
    dashContainerModel = new DashContainerModel({
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                allowClose: false,
                content: () => sampleGrid({omitGridTools: true})
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
                refreshMode: DashRefreshMode.ON_SHOW_ALWAYS,
                content: SimpleChartPanel
            },
            {
                id: 'buttonGroupPanel',
                title: 'Button Group',
                icon: Icon.question(),
                content: ButtonGroupPanel,
                contentModelFn: () => new ButtonGroupPanelModel(),
                getState: (contentModel) => {
                    const {buttonGroup} = contentModel.formModel.values;
                    return {buttonGroup};
                },
                setState: (state, contentModel) => {
                    contentModel.formModel.init(state);
                }
            },
            {
                id: 'simple',
                title: 'Simple Panel',
                renderMode: DashRenderMode.ALWAYS,
                content: SimplePanel
            }
        ],
        defaultState: [{
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
        }],
        initState: XH.localStorageService.get(this.stateKey, null)
    });

    saveState() {
        XH.localStorageService.set(this.stateKey, this.dashContainerModel.state);
        XH.toast({message: 'Dash state captured!'});
    }

    loadState() {
        const state = XH.localStorageService.get(this.stateKey, null);
        if (state) {
            this.dashContainerModel.loadStateAsync(state).then(() => {
                XH.toast({message: 'Dash state loaded!'});
            });
        } else {
            XH.toast({message: 'No saved state found', intent: 'danger'});
        }
    }

    resetState() {
        XH.localStorageService.remove(this.stateKey);
        this.dashContainerModel.resetStateAsync().then(() => {
            XH.toast({message: 'Dash state reset to default'});
        });
    }
}
