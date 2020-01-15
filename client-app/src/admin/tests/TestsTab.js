/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {GridTestPanel} from './grids/GridTestPanel';
import {CubeDataPanel} from './cube/CubeDataPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './panels/PanelResizingTestPanel';
import {FetchApiTestPanel} from './fetch/FetchApiTestPanel'
import {StoreEditingPanel} from './storeEditing/StoreEditingPanel';
import {SelectTestPanel} from './Select/SelectTestPanel';

export const TestsTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.tests',
            tabs: [
                {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
                {id: 'grid', title: 'Grid', content: GridTestPanel},
                {id: 'cube', title: 'Cube Data', content: CubeDataPanel},
                {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel},
                {id: 'panelResizing', title: 'Panel Resizing', content: PanelResizingTestPanel},
                {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
                {id: 'storeEditing', title: 'Store Editing', content: StoreEditingPanel},
                {id: 'select', title: 'Select', content: SelectTestPanel}
            ],
            switcherPosition: 'left'
        }
    })
);