/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {GridTestPanel} from './grids/GridTestPanel';
import {CubeTestPanel} from './cube/CubeTestPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './panels/PanelResizingTestPanel';
import {FetchApiTestPanel} from './fetch/FetchApiTestPanel';
import {StoreEditingPanel} from './storeEditing/StoreEditingPanel';
import {SelectTestPanel} from './Select/SelectTestPanel';
import {dataViewTestPanel} from './dataview/DataViewTestPanel';
import {Component} from 'react';
import {HoistModel} from '@xh/hoist/core';
import {HoistComponent} from '@xh/hoist/deprecated';

// Lets test our deprecated Class Component decorator right here.
@HoistComponent
export class TestsTab extends Component {
    model = new TestsTabModel();

    render() {
        return tabContainer({model: this.model.tabContainerModel});
    }
}

class TestsTabModel extends HoistModel {
    tabContainerModel = new TabContainerModel({
        route: 'default.tests',
        tabs: [
            {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
            {id: 'grid', title: 'Grid', content: GridTestPanel},
            {id: 'dataView', title: 'Data View', content: dataViewTestPanel},
            {id: 'cube', title: 'Cube Data', content: CubeTestPanel},
            {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel},
            {id: 'panelResizing', title: 'Panel Resizing', content: PanelResizingTestPanel},
            {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
            {id: 'storeEditing', title: 'Store Editing', content: StoreEditingPanel},
            {id: 'select', title: 'Select', content: SelectTestPanel}
        ],
        switcher: {orientation: 'left'}
    });
}

