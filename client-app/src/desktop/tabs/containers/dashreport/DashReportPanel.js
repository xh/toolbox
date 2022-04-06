import {switchInput, numberInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp, HoistModel, managed, RefreshMode, RenderMode, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashReport, DashReportModel} from '@xh/hoist/desktop/cmp/dash';
import {buttonWidget, chartWidget, gridWidget, panelWidget, treeGridWidget} from '../widgets';
import {wrapper} from '../../../common';

export const dashReportPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashReport</code> is configured and managed via a
                    <code>DashReportModel</code> and allows the user to drag-and-drop content into various
                    scrollable layouts.

                    This component also supports publishing observable state.
                </p>
            ],
            item: panel({
                title: 'Layout › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: model.renderDashboard ?
                    frame(dashReport()):
                    frame({
                        item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                        padding: 10
                    }),
                bbar: bbar()
            }),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/dashreport/DashReportPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/dash/report/DashReport.js', notes: 'Hoist container component.'},
                {url: '$HR/desktop/cmp/dash/report/DashReportModel.js', notes: 'Hoist container model - primary API.'},
                {url: '$HR/desktop/cmp/dash/report/DashReportViewSpec.js', notes: 'Configuration template for contained views.'},
                {url: '$HR/desktop/cmp/dash/report/DashReportViewModel.js', notes: 'Model for contained view instances. '}
            ]
        });
    }
});

const bbar = hoistCmp.factory(
    ({model}) => toolbar({
        enableOverflowMenu: true,
        children: [
            switchInput({
                label: 'Render Dashboard',
                bind: 'renderDashboard',
                labelSide: 'left'
            }),
            '-',
            /* TODO: Support these flags?
            switchInput({
                label: 'Layout Locked',
                bind: 'layoutLocked',
                labelSide: 'left',
                model: model.dashContainerModel
            }),
            '-',
            switchInput({
                label: 'Content Locked',
                bind: 'contentLocked',
                labelSide: 'left',
                model: model.dashContainerModel
            }),
            '-',
            switchInput({
                label: 'Rename Locked',
                bind: 'renameLocked',
                labelSide: 'left',
                model: model.dashContainerModel
            }),
             */
            'Columns',
            numberInput({
                width: 80,
                bind: 'columns',
                model: model.dashReportModel
            }),
            '-',
            'Row Height (px)',
            numberInput({
                width: 80,
                bind: 'rowHeight',
                model: model.dashReportModel
            }),
            '-',
            switchInput({
                bind: 'isDraggable',
                label: 'Enable Dragging',
                model: model.dashReportModel
            }),
            '-',
            switchInput({
                bind: 'isResizable',
                label: 'Enable Resizing',
                model: model.dashReportModel
            }),
            '-',
            switchInput({
                bind: 'compact',
                label: 'Compact Views',
                model: model.dashReportModel
            }),
            filler(),
            button({
                text: 'Reset & Clear State',
                icon: Icon.reset(),
                onClick: () => model.resetState()
            })
        ]
    })
);

class Model extends HoistModel {
    @bindable renderDashboard = true;

    @managed
    dashReportModel = new DashReportModel({
        persistWith: {localStorageKey: 'dashReportState'},
        showMenuButton: true,
        initialViews: [
            {
                id: 'grid',
                width: 8,
                y: 4
            },
            {
                id: 'buttons',
                x: 0,
                y: 0
            },
            {
                id: 'buttons',
                y: 2
            },
            {
                id: 'panel',
                x: 5,
                y: 0,
                width: 3,
                height: 4
            },
            {
                id: 'treeGrid',
                y: 8
            }
        ],
        viewSpecDefaults: {
            icon: Icon.grid()
        },
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                unique: true,
                content: gridWidget,
                width: 5,
                height: 5,
                groupName: 'Group 1'
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.question(),
                content: buttonWidget,
                width: 5,
                height: 2,
                // allowRemove: false,
                allowRename: false
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: RefreshMode.ON_SHOW_ALWAYS,
                content: chartWidget,
                width: 8,
                height: 5
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                renderMode: RenderMode.ALWAYS,
                content: panelWidget
                // width and height default to 3 when not specified
                // Maybe the default value should be configurable at the container level?
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                content: treeGridWidget,
                width: 8,
                height: 6
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    resetState() {
        this.dashReportModel.restoreDefaults();
        XH.toast({message: 'Dash state reset to default'});
    }
}
