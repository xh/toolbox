/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {GridTestPanel} from './grids/GridTestPanel';
import {CubeDataPanel} from './cube/CubeDataPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';

@HoistComponent
export class TestsTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.tests',
                tabs: [
                    {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
                    {id: 'performance', title: 'Grid Performance', content: GridTestPanel},
                    {id: 'cube', title: 'Cube Data', content: CubeDataPanel},
                    {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel}
                ],
                switcherPosition: 'left'
            }
        });
    }
}