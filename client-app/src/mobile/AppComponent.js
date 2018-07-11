/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {frame} from '@xh/hoist/layout';

@HoistComponent()
export class AppComponent extends Component {

    render() {
        return frame(
            'Welcome to the Mobile Toolbox! -- Coming Soon!'
        );
    }
}